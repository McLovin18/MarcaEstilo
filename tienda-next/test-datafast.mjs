
console.log('=== Testing Datafast Status Check ===');
const baseUrl = "https://eu-test.oppwa.com";
const entityId = "8a829418533cf31d01533d06f2ee06fa";
const authToken = "OGE4Mjk0MTg1MzNjZjMxZDAxNTMzZDA2ZmQwNDA3NDh8WHQ3RjIyUUVOWA==";
const resourcePath = "/v1/checkouts/6E703D7C5639EDEA8BBCC8DE2DAD3B86.uat01-vm-tx04/payment";

console.log('baseUrl:', baseUrl);
console.log('entityId:', entityId);
console.log('authToken:', authToken.substring(0, 20) + '...');
console.log('resourcePath:', resourcePath);

const statusUrl = new URL(resourcePath, `${baseUrl}/`);
statusUrl.searchParams.set("entityId", entityId);

console.log('Checking status at URL:', statusUrl.toString());
console.log('Headers:', { Authorization: `Bearer ${authToken}` });

fetch(statusUrl.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${authToken}` },
    cache: "no-store",
}).then(async (res) => {
    console.log('Response status:', res.status, res.statusText);
    console.log('Response headers:', Array.from(res.headers.entries()));
    const text = await res.text();
    console.log('Response text:', text);
    try {
        const json = JSON.parse(text);
        console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch(e) {}
}).catch((err) => {
    console.error('Error:', err);
});
