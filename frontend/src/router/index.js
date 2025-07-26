import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Summary from '../views/Summary.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/summary/:publicId',
    name: 'Summary',
    component: Summary,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router