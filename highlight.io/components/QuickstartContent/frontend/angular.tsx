import {
	configureSourcemapsCI,
	identifySnippet,
	initializeSnippet,
	packageInstallSnippet,
	setupBackendSnippet,
	verifySnippet,
} from './shared-snippets'

import { siteUrl } from '../../../utils/urls'
import { QuickStartContent } from '../QuickstartContent'

const angularInitCodeSnippet = `// app.module.ts
    import { NgModule } from '@angular/core';
...

import { H } from 'highlight.run';

H.init('<YOUR_PROJECT_ID>', {
    environment: 'production',
    version: 'commit:abcdefg12345',
	networkRecording: {
		enabled: true,
		recordHeadersAndBody: true,
        urlBlocklist: [
            // insert full or partial urls that you don't want to record here
        ],
	},
});

@NgModule({
    ...
})
export class AppModule { }
`

export const AngularContent: QuickStartContent = {
	title: 'Angular',
	subtitle: 'Learn how to set up highlight.io with your Angular application.',
	logoUrl: siteUrl('/images/quickstart/angular.svg'),
	entries: [
		packageInstallSnippet,
		{
			...initializeSnippet,
			code: {
				...initializeSnippet.code,
				text: angularInitCodeSnippet,
				language: initializeSnippet.code?.language ?? 'js',
			},
		},
		identifySnippet,
		verifySnippet,
		configureSourcemapsCI(),
		setupBackendSnippet,
	],
}
