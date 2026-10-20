"""
Email notifications for application status changes.
All functions use fail_silently=True so a broken SMTP config
never crashes the API response.
"""

from django.core.mail import send_mail
from django.conf import settings


# Human-readable subject lines per status
STATUS_SUBJECTS = {
    'shortlisted': 'Your application has been shortlisted',
    'interview':   'You have been invited for an interview',
    'offer':       'Congratulations — you have received a job offer',
    'hired':       'Welcome! Your application has been accepted',
    'rejected':    'Update regarding your application',
}

# Plain-text body templates per status
STATUS_BODIES = {
    'shortlisted': (
        "Dear {name},\n\n"
        "We are pleased to inform you that your application for the position of "
        "{title} has been reviewed and you have been shortlisted for the next stage "
        "of our selection process.\n\n"
        "Our team will be in touch with you shortly regarding the next steps.\n\n"
        "Your application reference: {ref}\n\n"
        "Best regards,\n"
        "HR Team"
    ),
    'interview': (
        "Dear {name},\n\n"
        "Congratulations! We would like to invite you to an interview for the position "
        "of {title}.\n\n"
        "Please check your application portal or wait for further communication "
        "from our team with the interview schedule and details.\n\n"
        "Your application reference: {ref}\n\n"
        "Best regards,\n"
        "HR Team"
    ),
    'offer': (
        "Dear {name},\n\n"
        "We are delighted to inform you that following your interviews, we would like "
        "to extend a job offer to you for the position of {title}.\n\n"
        "Our HR team will be contacting you soon with the formal offer letter and "
        "further details.\n\n"
        "Your application reference: {ref}\n\n"
        "Best regards,\n"
        "HR Team"
    ),
    'hired': (
        "Dear {name},\n\n"
        "Welcome to the team! We are very pleased to confirm that you have "
        "successfully completed the recruitment process for {title} and your "
        "appointment has been confirmed.\n\n"
        "Our HR team will be reaching out to you with onboarding information shortly.\n\n"
        "Your application reference: {ref}\n\n"
        "Best regards,\n"
        "HR Team"
    ),
    'rejected': (
        "Dear {name},\n\n"
        "Thank you for your interest in the {title} position and for the time you "
        "invested in our selection process.\n\n"
        "After careful consideration, we regret to inform you that we will not be "
        "moving forward with your application at this time. We encourage you to apply "
        "for future openings that match your qualifications.\n\n"
        "Your application reference: {ref}\n\n"
        "Best regards,\n"
        "HR Team"
    ),
}


def send_interview_scheduled_email(interview):
    """
    Notify the assigned interviewer (and the candidate) when an interview is scheduled.
    Silently skips if no email address is available or SMTP is misconfigured.
    """
    application = interview.application
    candidate   = application.candidate
    vacancy     = application.vacancy
    interviewer = interview.interviewer

    scheduled_local = interview.scheduled_at.strftime('%A, %d %B %Y at %H:%M')
    mode_label = dict(interview.MODE_CHOICES).get(interview.mode, interview.mode)
    location_line = (
        f"Location / Link : {interview.location_or_link}"
        if interview.location_or_link
        else ""
    )

    # --- Email to the interviewer / recruiter ---
    if interviewer and getattr(interviewer, 'email', None):
        interviewer_body = (
            f"Dear {interviewer.get_full_name() or interviewer.username},\n\n"
            f"An interview has been scheduled for the following candidate:\n\n"
            f"  Position       : {vacancy.title}\n"
            f"  Candidate      : {candidate.full_name}\n"
            f"  Round          : {interview.round_number}\n"
            f"  Date & Time    : {scheduled_local}\n"
            f"  Mode           : {mode_label}\n"
        )
        if location_line:
            interviewer_body += f"  {location_line}\n"
        interviewer_body += (
            f"\nPlease be prepared and review the candidate's profile beforehand.\n\n"
            f"Best regards,\n"
            f"HR Team"
        )
        send_mail(
            subject=f"Interview Scheduled — {candidate.full_name} for {vacancy.title}",
            message=interviewer_body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hrportal.com'),
            recipient_list=[interviewer.email],
            fail_silently=True,
        )

    # --- Email to the candidate with schedule details ---
    if getattr(candidate, 'email', None):
        candidate_body = (
            f"Dear {candidate.full_name},\n\n"
            f"Your interview for the position of {vacancy.title} has been scheduled.\n\n"
            f"  Round          : {interview.round_number}\n"
            f"  Date & Time    : {scheduled_local}\n"
            f"  Mode           : {mode_label}\n"
        )
        if location_line:
            candidate_body += f"  {location_line}\n"
        candidate_body += (
            f"\nPlease make sure you are available at the scheduled time. "
            f"If you have any questions, contact our HR team.\n\n"
            f"Your application reference: {str(application.reference_code)}\n\n"
            f"Best regards,\n"
            f"HR Team"
        )
        send_mail(
            subject=f"Interview Scheduled — {vacancy.title} (Round {interview.round_number})",
            message=candidate_body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hrportal.com'),
            recipient_list=[candidate.email],
            fail_silently=True,
        )


def send_status_change_email(application, new_status):
    """
    Send an email to the candidate when their application status changes.
    Only sends for statuses that have a defined template.
    Silently skips if no email address is available or SMTP is misconfigured.
    """
    if new_status not in STATUS_SUBJECTS:
        return

    candidate_email = getattr(application.candidate, 'email', None)
    if not candidate_email:
        return

    subject = STATUS_SUBJECTS[new_status]
    body = STATUS_BODIES[new_status].format(
        name=application.candidate.full_name,
        title=application.vacancy.title,
        ref=str(application.reference_code),
    )

    send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hrportal.com'),
        recipient_list=[candidate_email],
        fail_silently=True,
    )
