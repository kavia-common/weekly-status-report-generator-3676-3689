import { useTourController } from './TourProvider';

// PUBLIC_INTERFACE
export default function useTour() {
  /** Returns the tour controller API (state + actions). */
  return useTourController();
}
