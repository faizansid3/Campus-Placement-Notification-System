const axios = require("axios");
const { MinPriorityQueue } = require("@datastructures-js/priority-queue");
const mockNotifications = require("./mockNotifications");

const API_URL =
  "http://4.224.186.213/evaluation-service/notifications";

const PRIORITY_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const TOP_N = 10;

// Generate priority score
function calculatePriority(notification) {
  const typeWeight = PRIORITY_WEIGHTS[notification.Type] || 0;

  // Convert timestamp into numeric value
  const timestampScore = new Date(notification.Timestamp).getTime();

  // Higher type weight dominates
  return typeWeight * 1_000_000_000_000 + timestampScore;
}

async function getTopNotifications() {
  let notifications = [];

  // Try fetching from API
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: "Bearer YOUR_TOKEN",
      },
    });

    notifications = response.data.notifications;

    console.log("Fetched notifications from API\n");
  } catch (error) {
    console.log("Using mock notification data...\n");

    notifications = mockNotifications;
  }

  // Min Heap
 const pq = new MinPriorityQueue((item) => item.priority);

  for (const notification of notifications) {
    const priority = calculatePriority(notification);

    const item = {
      notification,
      priority,
    };

    if (pq.size() < TOP_N) {
      pq.enqueue(item);
    } else {
      const smallest = pq.front();

      if (priority > smallest.element.priority) {
        pq.dequeue();
        pq.enqueue(item);
      }
    }
  }

  const result = [];

  while (!pq.isEmpty()) {
    result.push(pq.dequeue().notification);
  }

  result.reverse();

  console.log("\nTop Priority Notifications:\n");

  console.table(
    result.map((n) => ({
      ID: n.ID,
      Type: n.Type,
      Message: n.Message,
      Timestamp: n.Timestamp,
    }))
  );
}

getTopNotifications();