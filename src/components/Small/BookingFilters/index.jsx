import React from "react";
import { bookingsFilter } from "../../../services/dateUtils";

const FILTERS = [
  { value: 0, label: "Aujourd'hui" },
  { value: 1, label: "Demain" },
  { value: 2, label: "À venir" },
  { value: -1, label: "Passées" },
];

const BookingFilters = ({ filter, setFilter, bookings }) => (
  <div className="admin-prod__filters" style={{ marginBottom: "var(--ds-space-3, 12px)" }}>
    <div className="admin-prod__filter-pills">
      {FILTERS.map((f) => {
        const count = bookingsFilter(bookings, f.value).length;
        const active = filter === f.value;
        return (
          <button
            key={f.value}
            type="button"
            className={`admin-prod__filter-pill${active ? " admin-prod__filter-pill--active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label} ({count})
          </button>
        );
      })}
    </div>
  </div>
);

export default BookingFilters;
