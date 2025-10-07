import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
axios.defaults.baseURL = "https://mcpapi.itb-me.com/";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";



export default function useCart(encodedParam) {
    const router = useRouter();
    //console.log(encodedParam);
    function decodeParams(encoded) {
        try {
         //   console.log(encoded);

            // 1. URL-decode first
            let cleaned = decodeURIComponent(encoded);
         //   console.log(cleaned);

            // 2. Replace URL-safe Base64 characters if needed
            cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');

            // 3. Pad with = if missing
            while (cleaned.length % 4) {
                cleaned += '=';
            }

            const decoded = atob(cleaned);
            const parts = decoded.split("|");
            if (parts.length !== 3) {
                console.error("Decoded param does not have 3 parts:", decoded);
                return null;
            }
            const [tableName, storeId, orgId] = parts;
            return { tableName, storeId, orgId };
        } catch (e) {
            console.error("Invalid encoded param", e);
            return null;
        }
    }


    const organization = ref([]);
    const cartItems = ref([]);
    const data = ref([]);
    const selectedCurrency = ref("USD");
    const mainCurrency = ref("USD");
    const apiRate = ref({});
    const discount = ref(0);
    const paidAmount = ref(0);
    const selectedPayment = ref("full");

    const selectedTip = ref(0);
    const selectedTipMain = ref(0);
    const customTipInput =ref(0);
    const cssSelectedTip =ref(0);

   // absolute tip in main currency
    const isLoading = ref(true);
    const splitAmount = ref(0);
    const orderId=ref(0);
    const tableName = ref(null);
    const storeId = ref(null);
    const orgId = ref(null);
    const localSessionId = ref(localStorage.getItem('localSessionId') || crypto.randomUUID());
    localStorage.setItem('localSessionId', localSessionId.value);

    const paymentOptions = [
        { label: "Full Payment", value: "full" },
        { label: "Split Payment", value: "split" },
    ];

    //const currencies = ["USD", "LBP"];
    const currencies = ref([]);
    const currencyFlags = { USD: "🇺🇸", LBP: "🇱🇧" };
    //const baseTipValues = [5, 10, 15];
    const baseTipValues = ref([]);

    const tipValues = computed(() => {
        if (!apiRate.value || baseTipValues.value.length === 0) return [];

        return baseTipValues.value.map(tip => {
            const tipValue = parseFloat(tip.tip_value) || 0;

            // Get conversion rate from main currency to selected currency
            const rateNew = apiRate.value[selectedCurrency.value] || 1;
            const rateMain = apiRate.value[mainCurrency.value] || 1;
            const conversionRate = rateNew / rateMain;

            // convertedTip in selected currency (absolute amount)
            const convertedTip = tipValue * parseFloat(itemsSubtotal.value) * conversionRate;

            return {
                label: tip.label,
                tip_value: tipValue,         // decimal fraction
                convertedValue: convertedTip // absolute amount in selected currency
            };
        }).filter(tip => !isNaN(tip.tip_value));
    });
const token =ref('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJvcmdhbml6YXRpb25faWQiOiIzIiwidGltZSI6MTYzMzk1NjAxMX0.o8lKKydxsgRiNGzA4yaAyOUOR5L7ADSA1Eex4eMBkBw');
    // Load data
    const getConfig = async () => {
        try {
            const decoded = decodeParams(encodedParam);
            if (decoded) {
                tableName.value = decoded.tableName;
                storeId.value = decoded.storeId;
                orgId.value = decoded.orgId;
            }
            //console.log(tableName);
            const payload = {
                StoreId: storeId.value,
                OrgId: orgId.value,
            };
            const res = await axios.post(
                `/payment/config`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token.value,
                    }
                }
            );

            if (res.data.status === "success") {
                organization.value = res.data.organization;
                baseTipValues.value = res.data.tips || [];
                currencies.value = res.data.currencies.map(c => c.code);
                apiRate.value = {};
                res.data.currencies.forEach(c => {
                    apiRate.value[c.code] = parseFloat(c.rate); // convert string to number
                    if (c.is_main === "1") mainCurrency.value = c.code;
                });
                selectedCurrency.value = mainCurrency.value;
            }
        } catch (err) {
            console.error("Error fetching check data", err);
        }
    };
    const checkData = async () => {
        try {

            //const route = useRoute();
            //const encodedParam = route.params.encoded;

           // const { tableNm, storeNo, organizationId } = decodeParams(encodedParam);
            const decoded = decodeParams(encodedParam);
            if (decoded) {
                tableName.value = decoded.tableName;
                storeId.value = decoded.storeId;
                orgId.value = decoded.orgId;
            }
            //console.log(tableName);
            const payload = {
                TableName: tableName.value,
                StoreId: storeId.value,
                OrgId: orgId.value,
                SessionId:localSessionId.value
            };
            const res = await axios.post(
                `/check/scan`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token.value,
                    }
                }
            );
            if (res.data.status === "ready") {
                isLoading.value = false;
                data.value = res.data.data;
                orderId.value = res.data.data.id;
                //selectedCurrency.value = res.data.data.currency || "LBP";
               // mainCurrency.value=res.data.data.currency || "LBP";
                //apiRate.value = res.data.data.rate || 1;

                cartItems.value = res.data.data.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description || "",
                    price: item.gross_price,
                    quantity: item.quantity || 1,
                }));
                discount.value = res.data.data.promos.reduce(
                    (sum, promo) => sum + Number(promo.promo_amount),
                    0
                );
              /*  paidAmount.value = res.data.data.payments.reduce(
                    (sum, payment) => sum + Number(payment.pay_amount),
                    0
                ); */
                paidAmount.value = Number(res.data.total_paid);
            }
            else if(res.data.status === "closed")
            {
                isLoading.value = false;
                alert(res.data.message);
            }
            else {
                isLoading.value = true;
                setTimeout(checkData, 2000);
            }
        } catch (err) {
            console.error("Error fetching check data", err);
        }
    };

    const convertedCartItems = computed(() =>
        cartItems.value.map(item => {
            let price = Number(item.price);
            if (mainCurrency.value !== selectedCurrency.value) {
                price = price * (apiRate.value[selectedCurrency.value] / apiRate.value[mainCurrency.value]);
            }
            return { ...item, convertedPrice: price.toFixed(2) };
        })
    );
    const itemsSubtotal = computed(() => {
        return cartItems.value.reduce((sum, item) => {
            let price = Number(item.price);
            if (mainCurrency.value !== selectedCurrency.value) {
                price = price * (apiRate.value[selectedCurrency.value] / apiRate.value[mainCurrency.value]);
            }
            return sum + price * Number(item.quantity);
        }, 0).toFixed(2);
    });

    const convertedDiscount = computed(() =>
        (discount.value * (apiRate.value[selectedCurrency.value] / apiRate.value[mainCurrency.value])).toFixed(2)
    );

    const convertedPaidAmount = computed(() =>
        (paidAmount.value * (apiRate.value[selectedCurrency.value] / apiRate.value[mainCurrency.value])).toFixed(2)
    );


    const total = computed(() => {
        const subtotal = parseFloat(itemsSubtotal.value);

        // Convert tip USD to selected currency using dynamic rates
      //  console.log('selectedTipMain : '+selectedTipMain.value);
      //  console.log('apiRate.value[selectedCurrency.value] : '+apiRate.value[selectedCurrency.value]);
       // console.log('apiRate.value[mainCurrency.value] : '+apiRate.value[mainCurrency.value]);
        const tipAmount = selectedTipMain.value * (apiRate.value[selectedCurrency.value] / apiRate.value[mainCurrency.value]);
       // console.log('tipAmount' + tipAmount);
        const totalAmount = subtotal + tipAmount - convertedDiscount.value - convertedPaidAmount.value;
        return totalAmount.toFixed(2);
    });



    const isSplitPayment = computed(
        () => selectedPayment.value === "split"
    );

    // Watchers

    watch(selectedCurrency, (newCurrency) => {
        const rateNew = apiRate.value[newCurrency] || 1;
        const rateMain = apiRate.value[mainCurrency.value] || 1;

        // Convert absolute tip in main currency to new currency for input
        customTipInput.value = selectedTipMain.value * (rateNew / rateMain);
    });


    watch(splitAmount, (val) => {
        if (val < 0) splitAmount.value = 0;
        if (val > total.value) splitAmount.value = total.value;
        if (Number(val) === Number(total.value)) {
            selectedPayment.value = "full";
            splitAmount.value = 0;
        }
    });
    watch(customTipInput, (val) => {
        if (val > 0) {
            selectedTip.value = selectedTipMain.value / parseFloat(itemsSubtotal.value);
        }
    });
    // Methods

    const selectTip1 = (tip) => {
        const subtotalMain = parseFloat(itemsSubtotal.value) * (apiRate.value[mainCurrency.value] / (apiRate.value[selectedCurrency.value] || 1));

        // Tip percentage
        selectedTip.value = tip.tip_value;

        // Absolute tip in main currency
        selectedTipMain.value = subtotalMain * tip.tip_value;

        // Update custom input to match
        const rateSelected = apiRate.value[selectedCurrency.value] || 1;
        const rateMain = apiRate.value[mainCurrency.value] || 1;
        customTipInput.value = selectedTipMain.value * (rateSelected / rateMain);
    };
    const selectTip = (tip) => {
        cssSelectedTip.value = tip.tip_value;
        selectedTip.value = parseFloat(tip.tip_value) || 0; // percentage

        const subtotalMain = parseFloat(itemsSubtotal.value) * (apiRate.value[mainCurrency.value] / apiRate.value[selectedCurrency.value]);
        selectedTipMain.value = subtotalMain * selectedTip.value; // absolute tip in main currency
        customTipInput.value = (selectedTipMain.value * (apiRate.value[selectedCurrency.value] / apiRate.value[mainCurrency.value])).toFixed(2);
    };

    const updateCustomTip = () => {
        const rate = apiRate.value[selectedCurrency.value] || 1;
        const rateMain = apiRate.value[mainCurrency.value] || 1;

        // Convert input (current currency) to main currency
        selectedTipMain.value = customTipInput.value * (rateMain / rate);

        // Update percentage relative to subtotal in main currency
        const subtotalMain = parseFloat(itemsSubtotal.value);
        selectedTip.value = subtotalMain > 0 ? selectedTipMain.value / subtotalMain : 0;
    };
    const updateCustomTip1 = () => {
        const input = Number(customTipInput.value) || 0;

        const rateSelected = apiRate.value[selectedCurrency.value] || 1;
        const rateMain = apiRate.value[mainCurrency.value] || 1;

        // Convert to main currency
        selectedTipMain.value = input * (rateMain / rateSelected);

        // Update percentage relative to subtotal
        const subtotalMain = parseFloat(itemsSubtotal.value) * (rateMain / rateSelected);
        selectedTip.value = subtotalMain > 0 ? selectedTipMain.value / subtotalMain : 0;
    };

    const selectCurrency = (currency) => {
        selectedCurrency.value = currency;
    };

    const isProcessing = ref(false);

    const checkout = async () => {
        try {
            isProcessing.value = true;

            const payload = {
                OrderId:orderId.value,
                CheckNo:tableName.value,
                OrgId:orgId.value,
                StoreId:storeId.value,
                Currency: selectedCurrency.value,
                Total: total.value,
                Tip: customTipInput.value,
                PartAmount:splitAmount.value,
                items: cartItems.value.map(i => ({
                    id: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity
                })),
                PaymentType: selectedPayment.value,
                SessionId:localSessionId.value
            };

            // 1️⃣ Send cart/order data to Laravel backend
            const response = await axios.post('/payment/checkout', payload,{
                headers: {
                    'Content-Type': 'application/json',
                        'Authorization': token.value,
                }
            });

            // 2️⃣ Handle gateway response
            if (response.data.status === '3DS_REQUIRED') {
                // redirect to 3DS challenge
                window.location.href = response.data.redirectUrl;
            } else if (response.data.status === 'success') {
                // redirect to success page
                const sessionId = response.data.session_id;
               // await router.push({name: "Checkout", params: {sessionId: response.data.session_id}});
                window.location.href = `/payment/checkout/${sessionId}/${orgId.value}`;
               // window.location.href = '/payment/success/'+sessionId;
            } else {
                alert('Payment failed: ' + response.data.message);
            }
        } catch (err) {
            console.error('Checkout error', err);
            alert('Checkout failed. Please try again.');
        } finally {
            isProcessing.value = false;
        }
    };

    onMounted(async () => {
        await getConfig();   // Load organization / config data first
        await checkData();   // Then start fetching the check/order data
    });

    return {
        cartItems,
        data,
        selectedCurrency,
        apiRate,
        discount,
        paidAmount,
        selectedPayment,
        selectedTip,
        selectedTipMain,
        isLoading,
        splitAmount,
        paymentOptions,
        currencies,
        currencyFlags,
        convertedCartItems,
        convertedDiscount,
        convertedPaidAmount,
        total,
        itemsSubtotal,
        isSplitPayment,
        tipValues,
        selectTip,
        selectCurrency,
        checkout,
        isProcessing,
        mainCurrency,
        organization,
        customTipInput,
        updateCustomTip,
        cssSelectedTip
    };
}
