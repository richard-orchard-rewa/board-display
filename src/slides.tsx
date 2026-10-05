import type { ReactNode } from "react"
import { GitHubSlide } from "./slides/GitHubSlide"
import { IterationSlide } from "./slides/IterationSlide"
import { FeedbackSlide } from "./slides/FeedbackSlide"
import { SuccessMetricsSlide } from "./slides/SuccessMetricsSlide"
import { DashboardSlide } from "./slides/DashboardSlide"
import { VisionSlide } from "./slides/VisionSlide"

// Order + dwell time of the rotation. Comment out a line to disable a slide.
export const slides: { id: string; seconds: number; render: () => ReactNode }[] = [
  { id: "vision", seconds: 20, render: () => <VisionSlide /> },
  { id: "github", seconds: 25, render: () => <GitHubSlide /> },
  { id: "iteration", seconds: 25, render: () => <IterationSlide /> },
  { id: "feedback", seconds: 25, render: () => <FeedbackSlide /> },
  { id: "success", seconds: 20, render: () => <SuccessMetricsSlide /> },
  { id: "dashboard", seconds: 25, render: () => <DashboardSlide /> },
]
