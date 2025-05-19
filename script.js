'use strict';

//------------ Variables
const btn = document.querySelector('.btn-country');
const btnSearch = document.querySelector('.search__btn');
const inputSearch = document.querySelector('.search__input');
const countryContainer = document.querySelector('.container__country');
const neighboursContainer = document.querySelector('.neighbours__countries');
const neighboursContainerBig = document.querySelector('.container__neighbours');
const containerInputs = document.querySelector('.container__inputs');
const containerLocation = document.querySelector('.container__location');

// Media Querries
const query800 = window.matchMedia('(max-width: 800px)');
const query1000Up = window.matchMedia('(min-width: 1000px)');
const query1000Down = window.matchMedia('(max-width: 1000px)');

//------------ Functions
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function renderCountry(data, container, className = '', dataCity) {
  const html = `
  <article class="country ${className} ${
    dataCity || data.name === inputSearch.value ? `country__main` : ''
  }">
    <img class="country__img" src="${data.flags.svg}" />
    <div class="country__data">
      <h3 class="country__name">${data.name}</h3>
      ${
        dataCity
          ? `<p class="country__row country__row--city">${dataCity.city}`
          : ''
      }
      <h4 class="country__region">${data.region}</h4>
      
      <p class="country__row"><span>👫</span>${formatNumber(
        data.population
      )}</p>
      <p class="country__row"><span>🗣️</span>${
        data.languages[0].name[0].toUpperCase() +
        data.languages[0].name.slice(1)
      }</p>
      <p class="country__row"><span>💰</span>${data.currencies[0].name}</p>
    </div>
  </article>`;

  if (container === countryContainer)
    neighboursContainerBig.insertAdjacentHTML(
      'afterbegin',
      `<h1 class="neighbours__title">The Neighbours of ${data.name}</h1>`
    );

  if (dataCity || data.name === inputSearch.value)
    containerLocation.insertAdjacentHTML('beforeend', html);
  if (!dataCity && data.name !== inputSearch.value)
    container.insertAdjacentHTML('beforeend', html);
}

function getPosition() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

function renderError(msg, container) {
  container.insertAdjacentHTML(
    'afterbegin',
    `<h1 class="neighbours__title">${msg}</h1>`
  );
  container.style.opacity = 1;
}

// getNeighbours then() method
/*
function getNeighbours(urlNeighbour) {
  return fetch(urlNeighbour)
    .then(res => res.json())
    .then(neighbourData => {
      // console.log(neighbourData);
      renderCountry(neighbourData, 'neighbour');
      return neighbourData;
    });
}
*/

// getNeighbours async/await method
async function getNeighbours(urlNeighbour) {
  const fetchData = await fetch(urlNeighbour);
  // console.log(fetchData);
  if (!fetchData.ok) throw new Error('Problem getting neighbour data');
  const neighbourData = await fetchData.json();
  // console.log(neighbourData);
  renderCountry(neighbourData, neighboursContainer, 'neighbour');
  return neighbourData;
}

async function renderNeighbours(countryNeighbours) {
  const neighbours = await Promise.all(
    countryNeighbours.map(neighbour =>
      getNeighbours(`https://restcountries.com/v2/alpha/${neighbour}`)
    )
  );
  inputSearch.value = '';
  // console.log(neighbours);
  return neighbours;
}

function moveBtns(direction, height, width) {
  containerInputs.style.flexDirection = direction;
  containerInputs.style.height = height;
  document.querySelector('.search__btn').style.top = '2rem';
  document.querySelector('.search__input').style.width = width;
}

function resetUI() {
  containerLocation.classList.remove('hidden');
  if (containerLocation) containerLocation.innerHTML = '';
  if (neighboursContainer) neighboursContainer.innerHTML = '';
  if (document.querySelector('.neighbours__title'))
    document.querySelector('.neighbours__title').style.display = 'none';
  if (query1000Up.matches) {
    moveBtns('row', '100%', '30rem');
    document.querySelector('.search').style.width = '30rem';
  }
  if (query1000Down.matches) moveBtns('collumn', '40vh', 'inherit');
  neighboursContainerBig.classList.remove('hidden');
  containerLocation.style.height = 'inherit';
}

function renderMap(lat, lng) {
  const html = `<div id="map"></div>`;
  containerLocation.insertAdjacentHTML('beforeend', html);
  const map = new maplibregl.Map({
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [lng, lat],
    zoom: 13,
    container: 'map',
  });

  map.on('load', () => {
    // Generate a polygon using turf.circle
    // See https://turfjs.org/docs/#circle
    const radius = 0.6; // kilometer
    const options = {
      steps: 64,
      units: 'kilometers',
    };
    const circle = turf.circle([lng, lat], radius, options);

    // Add the circle as a GeoJSON source
    map.addSource('location-radius', {
      type: 'geojson',
      data: circle,
    });

    // Add a fill layer with some transparency
    map.addLayer({
      id: 'location-radius',
      type: 'fill',
      source: 'location-radius',
      paint: {
        'fill-color': 'orangered',
        'fill-opacity': 0.2,
      },
    });

    // Add a line layer to draw the circle outline
    map.addLayer({
      id: 'location-radius-outline',
      type: 'line',
      source: 'location-radius',
      paint: {
        'line-color': 'orangered',
        'line-width': 2,
      },
    });
  });
  return map;
}
////////////////////////////////////////////////////////////////////////////////

//------------ whereAmI using then() method
/*
function whereAmI(lat, lng) {
  fetch(
    `https://us1.api-bdc.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`
  )
    .then(response => {
      // console.log(response);
      if (!response.ok)
        throw new Error(
          `${response.status} Could not found a city with specified coordonates`
        );
      return response.json();
    })
    .then(data => {
      console.log(data);
      return fetch(`https://restcountries.com/v2/name/${data.countryName}`);
    })
    .then(response => response.json())
    .then(countryData => {
      // console.log(countryData[0]);
      const neighbours = countryData[0].borders;
      renderCountry(countryData[0]);

      return neighbours.forEach(neighbour =>
        getNeighbours(`https://restcountries.com/v2/alpha/${neighbour}`)
      );
    })
    .catch(err => console.log(`Something went wrong, ${err.message}!!`));
}


navigator.geolocation.getCurrentPosition(
  function (position) {
    // console.log(position);
    const { latitude: lat, longitude: lng } = position.coords;
    // console.log(lat, lng);
    btn.addEventListener('click', function () {
      countriesContainer.innerHTML = '';
      whereAmI(lat, lng);
    });
  },
  function () {
    alert(`Could not get your position!!`);
  }
);
*/

//------------ whereAmI using async/await
async function whereAmI() {
  try {
    // Geolocation
    const geo = await getPosition();
    // console.log(geo);
    const { latitude: lat, longitude: lng } = geo.coords;

    // Reverse Geocoding
    const revGeo = await fetch(
      `https://us1.api-bdc.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`
    );
    if (!revGeo.ok) throw new Error('Problem getting location data');
    const revGeoData = await revGeo.json();
    // console.log(revGeoData);

    // Fetch country data
    const currLocation = await fetch(
      `https://restcountries.com/v2/name/${revGeoData.countryName}`
    );
    if (!currLocation.ok) throw new Error('Problem getting country data');
    const [currLocationData] = await currLocation.json();

    // Render data
    renderCountry(currLocationData, countryContainer, '', revGeoData);
    renderMap(lat, lng);
    renderNeighbours(currLocationData.borders);
  } catch (err) {
    containerInputs.style.display = 'none';
    renderError(err.message, countryContainer);
    console.error(err.message);
  }
}

//------------ Search Country
async function searchCountry(countryName) {
  try {
    const country = await fetch(
      `https://restcountries.com/v2/name/${countryName}`
    );
    if (!country.ok) throw new Error('Problem getting country data');
    const [countryData] = await country.json();
    if (countryData.name !== inputSearch.value)
      throw new Error(`${inputSearch.value} is not a country !`);
    renderCountry(countryData, countryContainer);
    renderNeighbours(countryData.borders);
  } catch (err) {
    containerInputs.style.display = 'none';
    renderError(err.message, countryContainer);
    console.error(err.message);
  }
}

//------------ Event Listeners
btn.addEventListener('click', function () {
  resetUI();
  whereAmI();
  if (query800.matches) containerLocation.style.height = '90rem';
});

btnSearch.addEventListener('click', function (e) {
  e.preventDefault();
  resetUI();
  searchCountry(inputSearch.value);
});
