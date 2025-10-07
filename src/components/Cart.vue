<template>
    <div class="cart-page">
        <header>
            <div class="logo">
                <img :src="organization.logo_base_url+organization.logo" alt="Logo" v-if="organization.logo" />
                <div  v-if="organization.name" >
                    <h1>{{organization.name}}</h1>
                </div>
            </div>
        </header>
        <div v-if="isLoading" class="loading-screen">
            <p>Loading, please wait...</p>
            <!-- Optional spinner -->
            <div class="spinner"></div>
        </div>
        <div v-else-if="cartItems.length === 0">
        </div>
        <div v-else>
        <!-- Header -->


        <!-- Cart Container -->
        <div class="cart-container">
            <div class="section-box">
                <h3>💰 Select Currency</h3>
                <div class="tip-buttons">
                    <button
                        v-for="currency in currencies"
                        :key="currency"
                        :class="{ active: selectedCurrency == currency }"
                        @click="selectCurrency(currency)"
                    >
                        <span class="flag">{{ currencyFlags[currency] }}</span>
                        {{ currency }}
                    </button>
                </div>
            </div>

            <!-- Cart Items -->
            <div v-for="(item, index) in convertedCartItems" :key="index" class="cart-item">
                <div class="item-info"><h3>{{ item.name }} (x{{ item.quantity }})</h3> </div>
                <span class="item-price">{{ item.convertedPrice }} {{ selectedCurrency }}</span>
            </div>
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>{{ itemsSubtotal }} {{ selectedCurrency }}</span>
                </div>
                <div class="summary-row" v-if="discount > 0">
                    <span>Discount:</span>
                    <span>-{{ convertedDiscount }} {{ selectedCurrency }}</span>
                </div>
                <div class="summary-row" v-if="paidAmount > 0">
                    <span>Part Pay:</span>
                    <span>- {{ convertedPaidAmount }} {{ selectedCurrency }}</span>
                </div>

                <div class="summary-row" v-if="customTipInput > 0">
                    <span>Tip:</span>
                    <span>{{ customTipInput }} {{ selectedCurrency }}</span>
                </div>
                <div class="summary-row total">
                    <strong>Total:</strong>
                    <strong>{{ total }} {{ selectedCurrency }}</strong>
                </div>
            </div>
            <!-- Payment Options -->
            <div class="section-box">
                <h3>Select Payment Method</h3>
                <div class="payment-option" v-for="option in paymentOptions" :key="option.value">
                    <input
                        type="radio"
                        :id="option.value"
                        v-model="selectedPayment"
                        :value="option.value"
                    />
                    <label :for="option.value">{{ option.label }}</label>
                </div>
                <div v-if="isSplitPayment" class="split-input">
                    <input
                        type="number"
                        v-model.number="splitAmount"
                        :max="total"
                        :min="0"
                        placeholder="Enter split amount"
                        @input="onSplitInput"
                    />
                    <small>Must be between 0 and {{ selectedCurrency }} {{ total }}</small>
                </div>
            </div>

            <!-- Tip Section -->
            <div class="section-box">
                <h3>💰 Do you want to include a tip?</h3>
              <div class="tip-buttons">
                <button
                    v-for="tip in tipValues"
                    :key="tip.tip_value"
                    :class="{ active: cssSelectedTip === tip.tip_value }"
                    @click="selectTip(tip)"
                >
                  {{ tip.label }}
                </button>

                </div>
              <div class="tip-custom">
                <input
                    type="number"
                    v-model.number="customTipInput"
                    @input="updateCustomTip"
                    :placeholder="`Other tip in ${selectedCurrency}`"
                />
              </div>
            </div>


            <!-- Cart Summary -->
            <div class="cart-summary">
                <h3>Total: {{ total }} {{data.currency}}</h3>
                <button v-if="total > 0" class="checkout-btn" @click="checkout" :disabled="isProcessing">
                    {{ isProcessing ? 'Processing...' : 'Proceed to Checkout' }}
                </button>
            </div>
        </div>
        </div>
    </div>
</template>
<script setup>
import { useRoute } from "vue-router";
import useCart from '../composables/useCart';
/*const route = useRoute();
const encodedParam = route.params.encoded;
if (!route || !route.params) {
  console.error("Route or route.params is undefined");
}*/
function getEncodedParam() {
  const url = new URL(window.location.href)
  const path = url.pathname
  return path.slice(1) // remove leading '/'
}

const encodedParam = getEncodedParam()

const {
    cartItems,
    data,
    selectedCurrency,
    apiRate,
    discount,
    paidAmount,
    selectedPayment,
    selectedTip,
    selectedTipMain,
    tipValues,
    isLoading,
    paymentOptions,
    currencies,
    currencyFlags,
    convertedCartItems,
    convertedDiscount,
    convertedPaidAmount,
    total,
    itemsSubtotal,
    isSplitPayment,
    selectTip,
    selectCurrency,
    checkout,
    isProcessing,
    splitAmount,
    organization,
  customTipInput,      // <-- add this
  updateCustomTip,
  cssSelectedTip
} = useCart(encodedParam);


</script>


