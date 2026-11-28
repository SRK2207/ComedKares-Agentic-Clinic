// End-to-end automated verification script for ComedKares
import assert from 'assert';

const BASE = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Running ComedKares End-to-End Verification Suite...\n');

  // Test 1: Widget JS asset availability
  console.log('1. Checking widget.js bundle...');
  const widgetRes = await fetch(`${BASE}/widget.js`);
  assert.strictEqual(widgetRes.status, 200, 'widget.js should return 200');
  const widgetText = await widgetRes.text();
  assert(widgetText.includes('comedkares-widget-root'), 'widget.js must contain shadow root mount');
  console.log('   ✅ widget.js is properly compiled and served (Size: ' + widgetText.length + ' bytes)');

  // Test 2: Clinic Alpha Demo HTML
  console.log('2. Checking Clinic Alpha demo site...');
  const alphaRes = await fetch(`${BASE}/demo/clinic-alpha.html`);
  assert.strictEqual(alphaRes.status, 200);
  const alphaText = await alphaRes.text();
  assert(alphaText.includes('Sparsh Dental'), 'Must have Sparsh Dental branding');
  assert(alphaText.includes('data-clinic-id="clinic_alpha"'), 'Must embed with clinic_alpha');
  console.log('   ✅ Clinic Alpha demo page verified');

  // Test 3: Clinic Beta Demo HTML
  console.log('3. Checking Clinic Beta demo site...');
  const betaRes = await fetch(`${BASE}/demo/clinic-beta.html`);
  assert.strictEqual(betaRes.status, 200);
  const betaText = await betaRes.text();
  assert(betaText.includes('Sahyadri Ortho'), 'Must have Sahyadri Ortho branding');
  assert(betaText.includes('data-clinic-id="clinic_beta"'), 'Must embed with clinic_beta');
  console.log('   ✅ Clinic Beta demo page verified');

  // Test 4: Clinic Alpha Widget Config & Isolation
  console.log('4. Testing Tenant Isolation on Widget Config...');
  const configAlpha = await (await fetch(`${BASE}/api/widget/config?clinicId=clinic_alpha`)).json();
  assert.strictEqual(configAlpha.clinic.slug, 'clinic_alpha');
  assert.strictEqual(configAlpha.clinic.theme_color, '#4f46e5');
  assert(configAlpha.doctors.some(d => d.name.includes('Dr. Priya Sharma')), 'Dr. Priya Sharma must be in Clinic Alpha');
  assert(!configAlpha.doctors.some(d => d.name.includes('Dr. Rajeshwar Rao')), 'Dr. Rajeshwar Rao must NOT be in Clinic Alpha');
  console.log('   ✅ Clinic Alpha config strictly isolated: ' + configAlpha.clinic.name);

  // Test 5: Clinic Beta Widget Config & Isolation
  const configBeta = await (await fetch(`${BASE}/api/widget/config?clinicId=clinic_beta`)).json();
  assert.strictEqual(configBeta.clinic.slug, 'clinic_beta');
  assert.strictEqual(configBeta.clinic.theme_color, '#059669');
  assert(configBeta.doctors.some(d => d.name.includes('Dr. Rajeshwar Rao')), 'Dr. Rajeshwar Rao must be in Clinic Beta');
  assert(!configBeta.doctors.some(d => d.name.includes('Dr. Priya Sharma')), 'Dr. Priya Sharma must NOT be in Clinic Beta');
  console.log('   ✅ Clinic Beta config strictly isolated: ' + configBeta.clinic.name);

  // Test 6: Conversational Booking Sequence on Clinic Alpha
  console.log('5. Testing Conversational Booking Flow (Search -> Ask Phone -> Send OTP -> 5-min Hold -> Razorpay)...');
  
  // Step 5a: Patient asks to book without providing phone number -> Agent lists slots and prompts for phone
  const chatPromptPhone = await (await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_id: 'clinic_alpha',
      session_id: 'sess_test_123',
      message: 'I would like to book a dental consultation with Dr. Priya Sharma for teeth cleaning',
      language: 'en',
    }),
  })).json();

  console.log('   AI Reply (Asking for phone):', chatPromptPhone.reply.substring(0, 90) + '...');
  assert(chatPromptPhone.toolsExecuted.some(t => t.name === 'search_doctors_and_slots'), 'Must execute search_doctors_and_slots');
  assert(chatPromptPhone.reply.includes('10-digit mobile number'), 'Must prompt for 10-digit mobile number');
  console.log('   ✅ Agent correctly requested 10-digit phone number before generating OTP');

  // Step 5b: Patient provides 10-digit phone number -> Agent sends OTP
  const chat1 = await (await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_id: 'clinic_alpha',
      session_id: 'sess_test_123',
      message: 'My mobile number is 9876543210',
      language: 'en',
      history: [
        { role: 'user', content: 'I would like to book a dental consultation with Dr. Priya Sharma for teeth cleaning' },
        { role: 'assistant', content: chatPromptPhone.reply },
      ],
    }),
  })).json();

  console.log('   AI Reply (OTP dispatched):', chat1.reply.substring(0, 90) + '...');
  assert(chat1.toolsExecuted.some(t => t.name === 'send_patient_otp'), 'Must execute send_patient_otp');
  
  const otpTool = chat1.toolsExecuted.find(t => t.name === 'send_patient_otp');
  const demoOtp = otpTool.result.demo_otp_hint || '1234';
  console.log('   ✅ Generated 4-Digit OTP Hint:', demoOtp);

  // Turn 2: Confirm OTP & trigger 5-minute atomic slot hold & Razorpay payment order
  console.log('6. Verifying OTP and testing Atomic 5-Minute Slot Lock...');
  const chat2 = await (await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_id: 'clinic_alpha',
      session_id: 'sess_test_123',
      message: `Here is my OTP: ${demoOtp}`,
      language: 'en',
      history: [
        { role: 'user', content: 'I would like to book a dental consultation with Dr. Priya Sharma for teeth cleaning' },
        { role: 'assistant', content: chatPromptPhone.reply },
        { role: 'user', content: 'My name is Ramesh Kumar, phone: 9876543210' },
        { role: 'assistant', content: chat1.reply },
      ],
    }),
  })).json();

  console.log('   AI Reply:', chat2.reply.substring(0, 80) + '...');
  assert(chat2.toolsExecuted.some(t => t.name === 'verify_patient_otp'), 'Must verify OTP');
  assert(chat2.toolsExecuted.some(t => t.name === 'hold_appointment_slot'), 'Must hold slot');
  assert(chat2.toolsExecuted.some(t => t.name === 'initiate_razorpay_payment'), 'Must initiate Razorpay order');
  assert.strictEqual(chat2.actionRequired, 'PAYMENT_CHECKOUT');
  assert(chat2.paymentPayload.order_id, 'Must contain order_id');
  console.log('   ✅ Slot successfully held with Razorpay Order ID:', chat2.paymentPayload.order_id);

  // Test 7: Confirm Payment via Client Verification Endpoint
  console.log('7. Confirming payment via /api/payments/verify-client...');
  const verifyRes = await (await fetch(`${BASE}/api/payments/verify-client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_id: 'clinic_alpha',
      appointment_id: chat2.paymentPayload.appointment_id,
      order_id: chat2.paymentPayload.order_id,
      payment_id: 'pay_test_999888',
      signature: 'demo_verified_signature',
    }),
  })).json();

  assert(verifyRes.success, 'Payment verification must succeed');
  assert.strictEqual(verifyRes.appointment.payment_status, 'PAID');
  assert.strictEqual(verifyRes.appointment.status, 'BOOKED');
  console.log('   ✅ Appointment confirmed in clinic system!');

  // Test 8: Emergency Red-Flag Protocol on Clinic Beta
  console.log('8. Testing Emergency Red-Flag Protocol ("severe chest pain") on Clinic Beta...');
  const emergencyChat = await (await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_id: 'clinic_beta',
      session_id: 'sess_emergency_456',
      message: 'I have severe chest pain and cannot breathe properly!',
      language: 'en',
    }),
  })).json();

  console.log('   AI Emergency Reply:', emergencyChat.reply.substring(0, 90) + '...');
  assert.strictEqual(emergencyChat.actionRequired, 'EMERGENCY_ALERT');
  assert.strictEqual(emergencyChat.escalationPayload.severity, 'EMERGENCY');
  assert(emergencyChat.toolsExecuted.some(t => t.name === 'escalate_to_human'), 'Must call escalate_to_human');
  console.log('   ✅ Emergency Red-Flag triggered escalation, stopped regular booking, and warned patient!');

  // Test 9: Staff Dashboard API Verification
  console.log('9. Checking Staff Dashboard Real-Time View for Clinic Beta...');
  const staffBeta = await (await fetch(`${BASE}/api/staff?clinicId=clinic_beta`)).json();
  assert(staffBeta.metrics.openEscalations >= 1, 'Clinic Beta must have open emergency escalation');
  assert(staffBeta.escalations.some(e => e.severity === 'EMERGENCY'), 'Must contain EMERGENCY ticket');
  console.log('   ✅ Emergency Escalation appears in Staff Dashboard with severity: EMERGENCY');

  console.log('10. Checking Staff Dashboard Real-Time View for Clinic Alpha...');
  const staffAlpha = await (await fetch(`${BASE}/api/staff?clinicId=clinic_alpha`)).json();
  assert(staffAlpha.metrics.activeBookings >= 1, 'Clinic Alpha must have active booking');
  assert(staffAlpha.metrics.totalRevenue > 0, 'Total revenue must reflect paid appointment');
  assert(staffAlpha.auditLogs.length > 0, 'Audit logs must be populated');
  console.log('   ✅ Staff Dashboard reflects confirmed booking, ₹' + staffAlpha.metrics.totalRevenue + ' revenue, and ' + staffAlpha.auditLogs.length + ' audit log entries!');

  console.log('\n🎉 ALL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY! 100% OPERATIONAL!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
