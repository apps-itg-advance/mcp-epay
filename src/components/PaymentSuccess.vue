<template>
  <div class="payment-success">
    <h1>Payment Successful!</h1>
    <p>Your payment has been completed successfully.</p>
    <p>Session ID: {{ sessionId }}</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const sessionId = route.params.sessionId; // get param from URL
</script>

<style scoped>
.payment-success {
  text-align: center;
  margin-top: 50px;
}
</style>