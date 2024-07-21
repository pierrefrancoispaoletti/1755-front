export const isBefore18h = () => {
  const now = new Date();
  const timeToShow = now.getHours();
  if (timeToShow || timeToShow === 0) {
    return timeToShow > 2 && timeToShow < 17; // If timeToShow is set, show the modal only between 2am and 6pm
  }
};
