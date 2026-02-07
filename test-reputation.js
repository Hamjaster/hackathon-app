// Test script to demonstrate reputation changes
const baseUrl = "http://localhost:5000";

async function testReputationSystem() {
    console.log("\n🧪 Testing Reputation System\n");

    try {
        // 1. Get a rumor ID from the feed
        const rumorsRes = await fetch(`${baseUrl}/api/rumors`, {
            credentials: "include",
        });
        const rumors = await rumorsRes.json();

        if (rumors.length === 0) {
            console.log("❌ No rumors found. Create one first!");
            return;
        }

        const rumor = rumors[0];
        console.log(`✅ Testing with rumor: "${rumor.content}"`);
        console.log(
            `   Current score: ${(rumor.trust_score * 100).toFixed(1)}%`,
        );
        console.log(`   Current status: ${rumor.status}`);

        // 2. Force resolution
        console.log("\n📊 Forcing resolution...");
        const resolveRes = await fetch(
            `${baseUrl}/api/demo/force-resolve/${rumor.id}`,
            {
                method: "POST",
                credentials: "include",
            },
        );

        if (!resolveRes.ok) {
            const error = await resolveRes.json();
            console.log(
                `❌ Resolution failed: ${error.error || error.message}`,
            );
            return;
        }

        const result = await resolveRes.json();
        console.log(`✅ Resolution successful!`);
        console.log(`   New status: ${result.newStatus}`);
        console.log(`   Voters updated: ${result.votersUpdated}`);

        // 3. Check updated user stats
        console.log("\n👤 Checking your updated stats...");
        const statsRes = await fetch(`${baseUrl}/api/user/stats`, {
            credentials: "include",
        });
        const stats = await statsRes.json();

        console.log(`✅ Your Stats:`);
        console.log(`   Reputation: ${(stats.reputation * 100).toFixed(1)}%`);
        console.log(`   Total Points: ${stats.totalPoints}`);
        console.log(`   Staked Points: ${stats.pointsStaked}`);
        console.log(
            `   Correct Votes: ${stats.correctVotes}/${stats.totalVotes}`,
        );

        console.log(
            "\n✨ Reputation updated! Refresh your browser to see changes.",
        );
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run test
testReputationSystem();
