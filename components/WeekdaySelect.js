import React from 'react';
import { Select, Typography } from '@ensdomains/thorin';

function getNextDays(numDays) {
  const result = [];
  for (let i = 1; i <= numDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    result.push(date);
  }
  return result;
}

function formatDate(date) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdays[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (
    <Typography variant="label" className="ml-[-1px] lg:ml-2 lg:scale-110">
      {weekday}
      <span style={{ fontWeight: 'normal' }}>
        {` ${month}/${day}`}
      </span>
    </Typography>
  );
}

const WeekdaySelect = () => {
  const days = getNextDays(7);
  const options = days.map((day) => ({
    value: day.toISOString(),
    label: formatDate(day),
  }));

  return (
    <Select
      options={options}
      label = "Expires At"
      style={{background:"rgba(246,246,248)", borderColor:"transparent", borderRadius:"14px"}}
      placeholder="Select a day"
      // Pass the necessary props for event handling, value, etc.
    />
  );
};

export default WeekdaySelect;
