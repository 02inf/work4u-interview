import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import DigestList from '../views/DigestList.vue'
import DigestDetail from '../views/DigestDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/digests',
    name: 'DigestList',
    component: DigestList
  },
  {
    path: '/digest/:id',
    name: 'DigestDetail',
    component: DigestDetail,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
