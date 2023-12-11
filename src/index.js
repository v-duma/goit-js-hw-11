import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import axios from 'axios';

const gallery = document.querySelector('.gallery');
const loader = document.querySelector('.loader');
const main = document.querySelector('main');
const form = document.querySelector('#search-form');
const lightbox = new SimpleLightbox('.gallery a');
let page = 1;
let totalPages = 1;

// Додана нова змінна для визначення відстані до кінця сторінки
const distanceToBottom = 5;

async function pageInfo(page) {
  const params = new URLSearchParams({
    per_page: 40,
    key: '41133691-77a955476127a28217fdbeead',
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page: page,
    q: form.elements.searchQuery.value.trim().replaceAll(' ', '+'),
  });
  const URL = `https://pixabay.com/api/?${params}`;
  const response = await axios.get(URL);
  totalPages = Math.ceil(response.data.totalHits / 40);
  return response;
}

async function sendRequest(event) {
  if (!form.elements.searchQuery.value.trim()) {
    return;
  }
  event.preventDefault();
  gallery.innerHTML = '';
  page = 1;

  const response = await pageInfo(page);
  await imageProcessing(response.data.hits);

  if (response.data.totalHits === 0) {
    Notiflix.Notify.failure("Sorry, we didn't find any images for your request");
    loader.classList.remove('visible');
    main.style.marginTop = '0px';
  } else if (response.data.totalHits === 1) {
    Notiflix.Notify.success(`Hooray! We found 1 image.`);
  } else {
    Notiflix.Notify.success(`Hooray! We found ${response.data.totalHits} images.`);
  }
}

function imageProcessing(images) {
  main.style.marginTop = '60px';
  const markup = images
    .map(image => {
      const {
        id,
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      } = image;

      return `
            <a class="gallery__link" href="${largeImageURL}">
              <div class="gallery__item" id="${id}">
                <img class="gallery-item_img" src="${webformatURL}" alt="${tags}" loading="lazy" />
                <div class="info">
                  <p class="info-item"><b>Likes</b>${likes}</p>
                  <p class="info-item"><b>Views</b>${views}</p>
                  <p class="info-item"><b>Comments</b>${comments}</p>
                  <p class="info-item"><b>Downloads</b>${downloads}</p>
                </div>
              </div>
            </a>
          `;
    })
    .join('');

  gallery.insertAdjacentHTML('beforeend', markup);
  lightbox.refresh();
  loader.classList.add('visible');
}

async function loadNextImages(entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting && page < totalPages) {
      page++;
      const response = await pageInfo(page);
      const images = response.data.hits;
      loader.classList.remove('visible');

      imageProcessing(images);

      const { height: cardHeight } = document
        .querySelector('.gallery')
        .firstElementChild.getBoundingClientRect();

      window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth',
      });
    }
  });
}

const observer = new IntersectionObserver(loadNextImages);
observer.observe(loader);

form.addEventListener('submit', sendRequest);

let endOfCollectionNotified = false; // Додана змінна для відстеження вже відображених повідомлень

window.addEventListener('wheel', function (event) {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (!endOfCollectionNotified && event.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - distanceToBottom) {
    // Користувач прокрутив сторінку вниз

    // Визначте відстань до кінця сторінки
    Notiflix.Notify.info(`You've reached the end of the collection.`);
    loader.classList.remove('visible');

    // Помічаємо, що повідомлення вже відображено
    endOfCollectionNotified = true;
  }
});

