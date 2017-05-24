import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  // stop the form post
  e.preventDefault();
  console.log('HEART IT!!!!');
  console.log(this);  // this refers to the form tag
  //
  axios
    .post(this.action)
    .then(res => {
      console.log(res.data);
      // check if the heart is already hearted
      const isHearted = this.heart.classList.toggle('heart__button--hearted');  // access the heart button from the form
      $('.heart-count').textContent = res.data.hearts.length;
      if (isHearted) {
        this.heart.classList.add('heart__button--float');
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
      }
    })
    .catch(console.error);
}

export default ajaxHeart;
