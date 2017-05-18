//
function autocomplete(input, latInput, lngInput) {
  console.log(input, latInput, lngInput);
  if (!input) return; // skip if there is no address input on the page

  const dropdown = new google.maps.places.Autocomplete(input);
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    console.log(place);
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });

  // if user hit enter on the address field, do not submit the form
  input.on('keydown', (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  });  // .on() is from bling.js
}

export default autocomplete;
