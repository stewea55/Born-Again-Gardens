"use client";

function formatDisplayDate(dateStr, includeWeekday = true) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = months[d.getMonth()];
  const dayNum = d.getDate();
  const suffix = dayNum === 1 || dayNum === 21 || dayNum === 31 ? "st" : dayNum === 2 || dayNum === 22 ? "nd" : dayNum === 3 || dayNum === 23 ? "rd" : "th";
  if (!includeWeekday) return `${month} ${dayNum}${suffix}`;
  const dayName = days[d.getDay()];
  return `${dayName} ${month} ${dayNum}${suffix}`;
}

function formatDisplayTime(timeStr) {
  if (!timeStr) return "";
  const part = String(timeStr).trim().slice(0, 5);
  const [h, m] = part.split(":").map(Number);
  if (Number.isNaN(h)) return timeStr;
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  const min = Number.isNaN(m) ? 0 : m;
  return min === 0 ? `${hour} ${ampm}` : `${hour}:${String(min).padStart(2, "0")} ${ampm}`;
}

export default function UpcomingEvents({ events }) {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <section className="section card">
        <h2 className="subheading">Upcoming Events</h2>
        <p className="paragraph">No upcoming events posted yet.</p>
      </section>
    );
  }

  return (
    <section className="section card">
      <h2 className="subheading">Upcoming Events</h2>
      <div>
        {events.map((event) => {
          const hasDate = event.event_start_date || event.event_end_date;
          const hasTime = event.event_start_time || event.event_end_time;
          const hasBothDates = !!(event.event_start_date && event.event_end_date);
          const startDateFormatted = event.event_start_date
            ? formatDisplayDate(event.event_start_date, !hasBothDates)
            : "";
          const endDateFormatted = event.event_end_date
            ? formatDisplayDate(event.event_end_date, !hasBothDates)
            : "";
          let dateRange = startDateFormatted || endDateFormatted;
          if (hasBothDates) {
            dateRange = startDateFormatted === endDateFormatted
              ? startDateFormatted
              : `${startDateFormatted} – ${endDateFormatted}`;
          }
          const startTimeFormatted = event.event_start_time ? formatDisplayTime(event.event_start_time) : "";
          const endTimeFormatted = event.event_end_time ? formatDisplayTime(event.event_end_time) : "";
          const timeRange =
            startTimeFormatted && endTimeFormatted && startTimeFormatted !== endTimeFormatted
              ? `${startTimeFormatted} – ${endTimeFormatted}`
              : startTimeFormatted || endTimeFormatted;

          return (
            <article key={event.id} className="upcoming-event-item">
              <h3 className="subheading upcoming-event-title">{event.event_name || "Untitled event"}</h3>
              <div className="upcoming-event-details">
                {event.image_url ? (
                  <p className="paragraph upcoming-event-image-wrap">
                    <img src={event.image_url} alt="" className="upcoming-event-image" />
                  </p>
                ) : null}
                {hasDate ? (
                  <p className="paragraph upcoming-event-when">
                    <strong>When:</strong> {dateRange}
                  </p>
                ) : null}
                {hasTime ? (
                  <p className="paragraph upcoming-event-time">
                    <strong>Time:</strong> {timeRange}
                  </p>
                ) : null}
                {event.additional_textbox ? (
                  <p className="paragraph upcoming-event-additional">{event.additional_textbox}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
