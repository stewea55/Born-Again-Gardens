"use client";

import { useState } from "react";

export default function UpcomingEvents({ events }) {
  const [openId, setOpenId] = useState(null);

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
      <ul className="bullet-list">
        {events.map((event) => {
          const isOpen = openId === event.id;
          return (
            <li key={event.id} className="upcoming-event-item">
              <button
                type="button"
                className="upcoming-event-toggle"
                onClick={() => setOpenId((current) => (current === event.id ? null : event.id))}
              >
                {event.title || "Untitled event"}
              </button>
              {isOpen && event.details ? (
                <p className="paragraph upcoming-event-details">{event.details}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
