// eslint-disable-next-line no-restricted-imports
import { Tabs as AntDesignTabs, TabsProps } from 'antd';
import React from 'react';
const { TabPane } = AntDesignTabs;
import useLocalStorage from '@rehooks/local-storage';
import classNames from 'classnames';

import styles from './Tabs.module.scss';

export interface TabItem {
    key: string;
    title?: string | React.ReactNode; // If undefined, `key` will be used as the title
    panelContent: React.ReactNode;
}

type Props = Pick<
    TabsProps,
    'animated' | 'tabBarExtraContent' | 'centered' | 'onChange'
> & {
    tabs: TabItem[];
    /** A unique value to distinguish this tab with other tabs. */
    id: string;
    /** Whether the tab contents has the default padding. */
    noPadding?: boolean;
    /** Whether the tab headers have the default padding. */
    noHeaderPadding?: boolean;
    /** An HTML id to attach to the tabs. */
    tabsHtmlId?: string;
    className?: string;
    tabBarExtraContentClassName?: string;
};

const Tabs = ({
    tabs,
    id,
    noPadding = false,
    noHeaderPadding = false,
    tabBarExtraContent,
    tabsHtmlId,
    className,
    tabBarExtraContentClassName,
    ...props
}: Props) => {
    const [activeTab, setActiveTab] = useLocalStorage(
        `tabs-${id || 'unknown'}-active-tab`,
        tabs[0].key || '0'
    );

    return (
        <AntDesignTabs
            {...props}
            activeKey={activeTab}
            defaultActiveKey={activeTab}
            onChange={(activeKey) => {
                if (props.onChange) {
                    props.onChange(activeKey);
                }
                setActiveTab(activeKey);
            }}
            tabBarExtraContent={
                tabBarExtraContent ? (
                    <div
                        className={classNames(
                            styles.extraContentContainer,
                            tabBarExtraContentClassName,
                            {
                                [styles.withHeaderPadding]: !noHeaderPadding,
                            }
                        )}
                    >
                        {tabBarExtraContent}
                    </div>
                ) : null
            }
            id={tabsHtmlId}
            className={classNames(styles.tabs, className, {
                [styles.noHeaderPadding]: noHeaderPadding,
            })}
        >
            {tabs.map(({ panelContent, title, key }) => (
                <TabPane
                    key={key}
                    tab={title ?? key}
                    className={classNames(styles.tabPane, {
                        [styles.withPadding]: !noPadding,
                    })}
                >
                    {panelContent}
                </TabPane>
            ))}
        </AntDesignTabs>
    );
};

export default Tabs;
