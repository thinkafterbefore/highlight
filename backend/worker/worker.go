package worker

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/jay-khatri/fullstory/backend/model"
	"github.com/jay-khatri/fullstory/backend/util"
	"github.com/pkg/errors"
	"github.com/slack-go/slack"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"

	parse "github.com/jay-khatri/fullstory/backend/event-parse"
	mgraph "github.com/jay-khatri/fullstory/backend/main-graph/graph"
	e "github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
)

// Worker is a job runner that parses sessions
type Worker struct {
	R *mgraph.Resolver
}

func (w *Worker) processSession(ctx context.Context, s *model.Session) error {
	// Set the session as processed; if any is error thrown after this, the session gets ignored.
	if err := w.R.DB.Model(&model.Session{}).Where(
		&model.Session{Model: model.Model{ID: s.ID}},
	).Updates(
		&model.Session{Processed: &model.T},
	).Error; err != nil {
		return errors.Wrap(err, "error updating session to processed status")
	}

	// Get the events with the earliest 'created_at' timestamp.
	firstEvents := &model.EventsObject{}
	if err := w.R.DB.Where(&model.EventsObject{SessionID: s.ID}).Order("created_at asc").First(firstEvents).Error; err != nil {
		return errors.Wrap(err, "error retrieving first set of events")
	}
	firstEventsParsed, err := parse.EventsFromString(firstEvents.Events)
	if err != nil {
		return errors.Wrap(err, "error parsing first set of events")
	}

	// Get the events with the latest 'created_at' timestamp.
	lastEvents := &model.EventsObject{}
	if err := w.R.DB.Where(&model.EventsObject{SessionID: s.ID}).Order("created_at desc").First(lastEvents).Error; err != nil {
		return errors.Wrap(err, "error retrieving last set of events")
	}
	lastEventsParsed, err := parse.EventsFromString(lastEvents.Events)
	if err != nil {
		return errors.Wrap(err, "error parsing last set of events")
	}

	// Calcaulate total session length and write the length to the session.
	diff := CalculateSessionLength(firstEventsParsed, lastEventsParsed)
	if err := w.R.DB.Model(&model.Session{}).Where(
		&model.Session{Model: model.Model{ID: s.ID}},
	).Updates(
		model.Session{
			// We are setting Viewed to false so sessions the user viewed while they were live will be reset.
			Viewed:    &model.F,
			Processed: &model.T,
			Length:    diff.Milliseconds(),
		},
	).Error; err != nil {
		return errors.Wrap(err, "error updating session to processed status")
	}

	// Send a notification that the session was processed.
	msg := slack.WebhookMessage{Text: fmt.Sprintf("```NEW SESSION \nid: %v\norg_id: %v\nuser_id: %v\nuser_object: %v\nurl: %v```",
		s.ID,
		s.OrganizationID,
		s.Identifier,
		s.UserObject,
		fmt.Sprintf("https://app.highlight.run/%v/sessions/%v", s.OrganizationID, s.ID))}
	err = slack.PostWebhook("https://hooks.slack.com/services/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", &msg)
	if err != nil {
		return errors.Wrap(err, "error sending slack hook")
	}
	return nil
}

// Start begins the worker's tasks.
func (w *Worker) Start() {
	ctx := context.Background()
	span, ctx := tracer.StartSpanFromContext(ctx, "worker.operation", tracer.ResourceName("worker.unit"))
	span.Finish()
	span.SetTag("backend", util.Worker)
	for {
		time.Sleep(1 * time.Second)
		now := time.Now()
		thirtySecondsAgo := now.Add(-30 * time.Second)
		sessions := []*model.Session{}
		span, ctx := tracer.StartSpanFromContext(ctx, "worker.sessionsQuery", tracer.ResourceName(now.String()))
		if err := w.R.DB.Where("(payload_updated_at < ? OR payload_updated_at IS NULL) AND (processed = ?)", thirtySecondsAgo, false).Find(&sessions).Error; err != nil {
			log.Errorf("error querying unparsed, outdated sessions: %v", err)
			continue
		}
		span.Finish()
		for _, session := range sessions {
			span, ctx := tracer.StartSpanFromContext(ctx, "worker.processSession", tracer.ResourceName(strconv.Itoa(session.ID)))
			if err := w.processSession(ctx, session); err != nil {
				tracer.WithError(e.Wrapf(err, "error processing session: %v", session.ID))
				continue
			}
			span.Finish()
		}
	}
}

// CalculateSessionLength gets the session length given two sets of ReplayEvents.
func CalculateSessionLength(first *parse.ReplayEvents, last *parse.ReplayEvents) time.Duration {
	d := time.Duration(0)
	fe := first.Events
	le := last.Events
	if len(fe) <= 0 || len(le) <= 0 {
		return d
	}
	start := first.Events[0].Timestamp
	end := last.Events[len(last.Events)-1].Timestamp
	d = end.Sub(start)
	return d
}
