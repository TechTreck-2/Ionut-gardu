# Nightly Tests Setup

This document explains how to configure the nightly test reports for your GitHub repository.

## Features

The nightly test workflow includes:
- **Scheduled execution**: Runs every night at 2:00 AM UTC
- **Automatic issue creation**: Creates GitHub issues with detailed test reports
- **Email notifications**: Optional email reports (requires setup)
- **Detailed reporting**: Includes test counts, failed test names, and links to workflow runs

## Setup Instructions

### 1. Automatic Issue Reports (No setup required)
The workflow automatically creates GitHub issues with test reports. Issues are labeled:
- `automated-test`, `success` for successful runs
- `automated-test`, `test-failure`, `bug` for failed runs

### 2. Email Notifications (Optional)

To enable email notifications, add these secrets to your repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EMAIL_USERNAME` | SMTP username (e.g., Gmail address) | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP password or app password | `your-app-password` |
| `NOTIFICATION_EMAIL` | Email address to receive reports | `team@company.com` |

#### Gmail Setup Example:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App passwords
3. Use your Gmail address as `EMAIL_USERNAME`
4. Use the generated App Password as `EMAIL_PASSWORD`

### 3. Customization

#### Change Schedule
Edit the cron expression in `.github/workflows/deploy.yml`:
```yaml
schedule:
  # Current: 2:00 AM UTC daily
  - cron: '0 2 * * *'
  
  # Examples:
  # - cron: '0 1 * * *'    # 1:00 AM UTC daily
  # - cron: '0 22 * * 0'   # 10:00 PM UTC on Sundays only
  # - cron: '0 6 * * 1-5'  # 6:00 AM UTC on weekdays
```

#### Disable Email Notifications
Remove or comment out the "Send email notification" step in the workflow.

## Report Format

### GitHub Issue Report
- **Title**: Includes date, status (SUCCESS/FAILURE), and emoji
- **Content**: 
  - Execution summary
  - Test counts (total, passed, failed)
  - List of failed test names
  - Links to workflow run and repository

### Email Report
- **Subject**: Status indicator with repository name
- **Body**: Summary of test results with link to full report

## Troubleshooting

### Tests Not Running
- Check that the cron schedule matches your expected time
- Verify the workflow file syntax is correct
- Check the Actions tab for any workflow errors

### Email Not Sending
- Verify all email secrets are set correctly
- Check that SMTP settings match your email provider
- Review the workflow logs for email delivery errors
- Make sure your email provider allows SMTP access

### Issue Creation Failing
- Ensure the repository has Issues enabled
- Check that the GitHub token has sufficient permissions
- Verify the workflow has `issues: write` permission

## Time Zones

The cron schedule uses UTC time. To convert to your local time:
- **EST (UTC-5)**: 2:00 AM UTC = 9:00 PM EST (previous day)
- **PST (UTC-8)**: 2:00 AM UTC = 6:00 PM PST (previous day)
- **CET (UTC+1)**: 2:00 AM UTC = 3:00 AM CET

Use online cron converters to calculate the right time for your timezone.
