export function adaptPlaceResult(p) {
  return {
    place_id: p.id,
    name: p.displayName,
    formatted_address: p.formattedAddress,
    geometry: { location: p.location },
    rating: p.rating,
    photos: p.photos,
    icon_mask_base_uri: p.svgIconMaskURI,
    icon_background_color: p.iconBackgroundColor,
  };
}
