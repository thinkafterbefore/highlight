import { LoadingOutlined } from '@ant-design/icons'
import {
	AppLoadingState,
	useAppLoadingContext,
} from '@context/AppLoadingContext'
import SvgHighlightLogoWithNoBackground from '@icons/HighlightLogoWithNoBackground'
import { Spin } from 'antd'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'
import BarLoader from 'react-spinners/BarLoader'

import styles from './Loading.module.scss'

export const CircularSpinner = ({ style }: { style?: React.CSSProperties }) => {
	return (
		<Spin
			indicator={
				<LoadingOutlined
					style={{
						fontSize: 24,
						...style,
					}}
					spin
				/>
			}
		/>
	)
}

export const LoadingBar = ({
	width,
	height,
}: {
	height?: string | number
	width?: string | number
}) => {
	return (
		<div className={styles.spinnerWrapper}>
			<div
				style={{ width: width || 100 }}
				className={styles.spinnerStyle}
			>
				<BarLoader width={width} height={height} color="#5629c6" />
			</div>
		</div>
	)
}

export const LoadingRightPanel = React.memo<{ show?: boolean }>(({ show }) => {
	return <LoadingPage show={show} className={styles.loadingFlexWrapper} />
})

export const LoadingPage = React.memo<{ show?: boolean; className?: string }>(
	({ show, className }) => {
		const { loadingState } = useAppLoadingContext()
		const speedFactor = 0.1

		return (
			<AnimatePresence>
				{(show ||
					[
						AppLoadingState.LOADING,
						AppLoadingState.EXTENDED_LOADING,
					].includes(loadingState)) && (
					<motion.div
						key="loadingWrapper"
						className={clsx(styles.loadingWrapper, className)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0, display: 'none' }}
						transition={{
							duration: 1.5 * speedFactor,
						}}
					>
						<motion.div
							key="container"
							className={styles.logoContainer}
							transition={{
								duration: 5 * speedFactor,
								repeat: Infinity,
								repeatType: 'mirror',
							}}
							initial={{ scale: 1 }}
							animate={{ scale: 0.8 }}
							exit={{ scale: 1 }}
						>
							<motion.div
								key="logo"
								className={styles.logo}
								initial={{ scale: 1.5 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.4 * speedFactor }}
							>
								<SvgHighlightLogoWithNoBackground />
							</motion.div>
							<motion.div
								key="background"
								className={styles.logoBackground}
								initial={{ opacity: 0, scale: 0 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.4 * speedFactor }}
							/>
						</motion.div>
						<motion.div
							key="primaryBackground"
							className={styles.background}
							initial={{ opacity: 0, scale: 2 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 2 }}
							transition={{ duration: 1 * speedFactor }}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		)
	},
)
