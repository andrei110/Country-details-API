'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');

// Functions

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function renderCountry(data, className = '') {
  const html = `
  <article class="country ${className}">
    <img class="country__img" src="${data.flags.svg}" />
    <div class="country__data">
      <h3 class="country__name">${data.name}</h3>
      <h4 class="country__region">${data.region}</h4>
      <p class="country__row"><span>👫</span>${formatNumber(
        data.population
      )}</p>
      <p class="country__row"><span>🗣️</span>${
        data.languages[0].nativeName[0].toUpperCase() +
        data.languages[0].nativeName.slice(1)
      }</p>
      <p class="country__row"><span>💰</span>${data.currencies[0].name}</p>
    </div>
  </article>`;

  countriesContainer.insertAdjacentHTML('beforeend', html);
  countriesContainer.style.opacity = 1;
}

function renderError(msg) {
  countriesContainer.insertAdjacentText('beforeend', msg);
  countriesContainer.style.opacity = 1;
}

function getNeighbours(urlNeighbour) {
  return fetch(urlNeighbour)
    .then(res => res.json())
    .then(neighbourData => {
      // console.log(neighbourData);
      renderCountry(neighbourData, 'neighbour');
    });
}

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

//Update challenge 1 😊
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
