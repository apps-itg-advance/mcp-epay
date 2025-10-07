<template>
  <div>
    <h2>Redirecting to Payment Gateway...</h2>
    <p>Please wait while we open the payment page.</p>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const sessionId = route.params.sessionId; // passed from backend
const orgId = route.params.orgId;
// Callbacks
window.errorCallback = function (error) {
  console.log("Payment error:", JSON.stringify(error));
};

window.cancelCallback = function () {
  console.log("Payment cancelled");
};

window.completeCallback = function () {
  console.log("Payment completed successfully!");
  window.location.href = `https://mcpapi.itb-me.com/gateway/payment/success/${sessionId}/${orgId}`;
};

// Load the Areeba script like you had in <script src=...>
function loadCheckoutScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById("areeba-checkout")) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "areeba-checkout";
    script.src = "https://epayment.areeba.com/static/checkout/checkout.min.js";
    script.setAttribute("data-error", "errorCallback");
    script.setAttribute("data-cancel", "cancelCallback");
    script.setAttribute("data-complete", "completeCallback");

    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Run on mount
onMounted(async () => {
  await loadCheckoutScript();

  // Configure checkout session
  Checkout.configure({
    session: { id: sessionId },
  });

  // Show the payment page
  Checkout.showPaymentPage();
});
</script>
