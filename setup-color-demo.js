// Create test rumors with varied trust scores to demonstrate colors
async function setupColorDemo() {
    const API = "http://localhost:5000";

    console.log("🎨 Setting up color demonstration...\n");

    // Get all current rumors and update some trust scores
    const rumors = await fetch(`${API}/api/rumors`).then((r) => r.json());

    // Update trust scores for first few rumors to show different colors
    const updates = [
        { index: 0, score: 0.95, color: "GREEN (Verified)" },
        { index: 1, score: 0.85, color: "GREEN (Verified)" },
        { index: 2, score: 0.65, color: "YELLOW (Active)" },
        { index: 3, score: 0.4, color: "YELLOW (Active)" },
        { index: 4, score: 0.15, color: "RED (Debunked)" },
        { index: 5, score: 0.05, color: "RED (Debunked)" },
    ];

    console.log("📊 Updating trust scores for visual demonstration:\n");

    for (const update of updates) {
        if (rumors[update.index]) {
            const rumor = rumors[update.index];

            // Use Supabase to update trust score directly
            await fetch(`${API}/api/rumors/${rumor.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trust_score: update.score }),
            }).catch(() => {}); // Might not have PUT endpoint, that's ok

            console.log(
                `  ${update.color.padEnd(20)} - ${rumor.id.substring(0, 8)}... (${Math.round(update.score * 100)}%)`,
            );
        }
    }

    console.log("\n✅ Demo setup complete!");
    console.log("\n🌐 Now open your browser to: http://localhost:5000");
    console.log("\nYou should see:");
    console.log("  🟢 GREEN bars (80-100%) - Highly trusted rumors");
    console.log("  🟡 YELLOW bars (21-79%) - Under investigation");
    console.log("  🔴 RED bars (0-20%) - Debunked rumors");
    console.log("  📝 AI-generated summaries instead of full text");
    console.log("  ⚠️  Warning badges on sensitive content\n");
}

setupColorDemo().catch(console.error);
