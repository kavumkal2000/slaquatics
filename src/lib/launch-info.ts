export const LAUNCH_ADDRESS = 'Point Vista Rd, Hickory Creek, TX 75065';
export const LAUNCH_CITY_LINE = 'Hickory Creek, TX 75065';
export const LAUNCH_HOURS = 'Mon-Sun 10 AM-8 PM';
export const LAUNCH_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Point+Vista+Rd+Hickory+Creek+TX+75065';
export const LAUNCH_MAPS_EMBED_URL = 'https://www.google.com/maps?q=Point+Vista+Rd+Hickory+Creek+TX+75065&output=embed';
export const LAUNCH_LOCATION_LABEL = `Shoreline Aquatics launch - ${LAUNCH_ADDRESS}`;

export const ARRIVAL_DIRECTIONS = [
  'Head down Point Vista Road, passing Hickory Park on your right.',
  'Continue until you see the boat ramp on your right, then drive past it.',
  'Follow the winding road to the dead end, where you will find parking.',
  'Park your vehicle and walk down to the shoreline, where we will be waiting with your rental.'
] as const;

export function arrivalDirectionsText() {
  return ARRIVAL_DIRECTIONS.map((step, index) => `${index + 1}. ${step}`).join('\n');
}
