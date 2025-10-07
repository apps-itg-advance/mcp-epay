import { createRouter, createWebHistory } from 'vue-router'
import CartPage from '../components/Cart.vue'
import CheckoutPage from '../components/Checkout.vue';
import PaymentSuccess from '../components/PaymentSuccess.vue';

const routes = [
    {
        path: '/payment/checkout/:sessionId/:orgId',
        name: 'Checkout',
        component: CheckoutPage
    },
    {
        path: '/pay/success/:sessionId',  // dynamic param
        name: 'PaymentSuccess',
        component: PaymentSuccess,
    },
    {
        path: '/:encoded',  // dynamic param
        name: 'Cart',
        component: CartPage,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
