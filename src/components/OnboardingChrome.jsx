import { Link } from 'react-router-dom'

export function OnboardingChrome({ eyebrow, title, subtitle, backTo, children = null }) {
  return (
    <div className="onboarding-flow">
      <div className="onboarding-header">
        <div className="onboarding-header-inner">
          <div>
            <div className="onboarding-wordmark">
              BUZZ<span>ER</span>
            </div>
            <div className="onboarding-eyebrow">{eyebrow}</div>
          </div>
          {backTo ? (
            <Link to={backTo} className="onboarding-back">
              Back
            </Link>
          ) : null}
        </div>
        {title ? <h1 className="onboarding-screen-title">{title}</h1> : null}
        {subtitle != null && subtitle !== '' ? (
          <div className="onboarding-screen-sub">{subtitle}</div>
        ) : null}
      </div>
      <div className="onboarding-body">{children}</div>
    </div>
  )
}
