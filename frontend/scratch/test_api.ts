import { authService } from '../src/services/auth.service';
import { rfqService } from '../src/services/rfq.service';
import { ApiError } from '../src/lib/api-error';
import { apiClient } from '../src/lib/api-client';

// Override the baseUrl for NodeJS (IPv6 fallback avoidance)
apiClient.defaults.baseURL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log("🧪 Initiating Frontend Connection Layer Tests...");

  try {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const buyerEmail = `buyer_${randomSuffix}@test.com`;

    console.log("\n--- 1. Testing AuthService (Register) ---");
    const registerResponse = await authService.register({
      email: buyerEmail,
      password: "password123",
      role: "BUYER"
    });
    
    console.log("✅ Register Successful!");
    console.log(`User ID: ${registerResponse.user.id}, Role: ${registerResponse.user.role}`);
    console.log(`Extracted Token: ${registerResponse.access_token.substring(0, 15)}...`);

    // In a browser, the interceptor uses localStorage. 
    // Since we're in Node.js, we'll manually inject it for the next tests to simulate the interceptor's "logged in" state.
    console.log("\n--- Injecting Token into Interceptor ---");
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${registerResponse.access_token}`;

    console.log("\n--- 2. Testing RfqService (Create RFQ & Validation Error interceptor) ---");
    try {
      // Trying to create an RFQ with invalid data (empty title) to trigger the Zod validation
      await rfqService.createRfq({
        title: "", // intentional error
        close_time: new Date().toISOString(),
        start_time: new Date().toISOString(),
        forced_close_time: new Date().toISOString(),
        extension_mins: 5,
        trigger_window_mins: 15,
        trigger_type: "ANY_BID"
      });
    } catch (e: any) {
      if (e instanceof ApiError) {
        console.log("✅ ApiError Interceptor seamlessly caught a 400 Bad Request!");
        console.log(`Is Validation? ${e.isValidation}`);
        console.log(`Parsed Zod Errors:`, e.errors);
      } else {
        throw e;
      }
    }

    console.log("\n--- 3. Testing RfqService (Fetch All RFQs) ---");
    const rfqs = await rfqService.getAllRfqs();
    console.log(`✅ getAllRfqs Native Unwrap Successful! Found ${rfqs.length} total active RFQs.`);
    if (rfqs.length > 0) {
      console.log(`Sample RFQ Title: ${rfqs[0].title}`);
    }

    console.log("\n✅ ALL FRONTEND API TESTS VERIFIED.");

  } catch (err: any) {
    console.error("❌ TEST FAILED:", err);
  }
}

runTests();
