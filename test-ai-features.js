// Test script to demonstrate AI features with different trust scores
const API_BASE = "http://localhost:5000";

async function testAIFeatures() {
    console.log("🧪 Testing AI Features...\n");

    // Create TEST RUMORS with different trust scenarios
    const testRumors = [
        {
            content:
                "VERIFIED: The university has officially confirmed that spring break will be extended by 3 days due to facility maintenance. Check the official website for details.",
            expectedTrust: 0.9, // High trust - should show GREEN
        },
        {
            content:
                "The library will have extended hours during finals week - 24/7 access from December 10-20. This has been confirmed by library staff.",
            expectedTrust: 0.75, // Medium-high trust - should show YELLOW
        },
        {
            content:
                "Someone heard that classes might be cancelled tomorrow, but there's no official announcement and weather looks fine.",
            expectedTrust: 0.4, // Medium-low trust - should show YELLOW
        },
        {
            content:
                "DEBUNKED: The rumor about free tuition next semester is completely false. The administration has officially denied this claim.",
            expectedTrust: 0.1, // Low trust - should show RED
        },
    ];

    console.log("Creating test rumors with AI processing...\n");

    for (let i = 0; i < testRumors.length; i++) {
        const rumor = testRumors[i];
        try {
            const response = await fetch(`${API_BASE}/api/rumors`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: rumor.content }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Rumor ${i + 1} created:`);
                console.log(`  ID: ${data.id.substring(0, 8)}...`);
                console.log(`  Summary: ${data.summary || "Processing..."}`);
                console.log(`  Trust Score: ${data.trust_score}`);
                console.log(`  Content Warning: ${data.content_warning}`);
                console.log("");

                // Update trust score to demonstrate colors
                await fetch(`${API_BASE}/api/rumors/${data.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ trust_score: rumor.expectedTrust }),
                }).catch(() => {
                    // Might not have PATCH endpoint, that's ok
                });
            }
        } catch (error) {
            console.error(`❌ Failed to create rumor ${i + 1}:`, error.message);
        }
    }

    // Display all rumors
    console.log("\n📋 Fetching all rumors...\n");
    try {
        const response = await fetch(`${API_BASE}/api/rumors`);
        const rumors = await response.json();

        console.log(`Found ${rumors.length} total rumors:`);
        console.log(
            "\n┌─────────────┬───────────────┬──────────┬─────────────┐",
        );
        console.log("│ ID          │ Trust Score   │ Color    │ Has Summary │");
        console.log("├─────────────┼───────────────┼──────────┼─────────────┤");

        rumors.slice(0, 10).forEach((r) => {
            const score = r.trust_score || 0.5;
            const percent = Math.round(score * 100);
            let color = "YELLOW";
            if (score >= 0.8) color = "GREEN ";
            if (score <= 0.2) color = "RED   ";
            const hasSummary = r.summary ? "YES" : "NO ";

            console.log(
                `│ ${r.id.substring(0, 8)}... │ ${percent}% (${score.toFixed(2)})  │ ${color}   │ ${hasSummary}         │`,
            );
        });

        console.log("└─────────────┴───────────────┴──────────┴─────────────┘");

        // Show color legend
        console.log("\n📊 Trust Score Color Guide:");
        console.log("  🟢 GREEN  (80-100%): Highly Verified");
        console.log(
            "  🟡 YELLOW (21-79%):  Under Investigation / Inconclusive",
        );
        console.log("  🔴 RED    (0-20%):   Debunked / False");

        console.log("\n✨ Now refresh your browser to see:");
        console.log("  1. Colored trust score bars on each rumor");
        console.log("  2. AI-generated summaries instead of full text");
        console.log("  3. Warning badges on sensitive content");
        console.log("\n👉 Open: http://localhost:5000\n");
    } catch (error) {
        console.error("❌ Failed to fetch rumors:", error.message);
    }
}

testAIFeatures().catch(console.error);
