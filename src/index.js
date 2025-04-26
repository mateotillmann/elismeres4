import { Router } from "itty-router"
import { getEmployees, getEmployee } from "./lib/data"
import { getRewardCards, assignExistingCard } from "./lib/data"
import { getManagerCards, getManagerCard } from "./lib/data"

// Create a new router
const router = Router()

// Define routes for employees
router.get("/api/employees", async (request) => {
  try {
    const employees = await getEmployees()
    return new Response(JSON.stringify(employees), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch employees" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

router.get("/api/employees/:id", async (request, { params }) => {
  try {
    const employee = await getEmployee(params.id)

    if (!employee) {
      return new Response(JSON.stringify({ error: "Employee not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify(employee), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

// Define routes for rewards
router.get("/api/rewards", async (request) => {
  try {
    const rewards = await getRewardCards()
    return new Response(JSON.stringify(rewards), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch rewards" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

// Define routes for managers
router.get("/api/managers", async (request) => {
  try {
    const managers = await getManagerCards()
    return new Response(JSON.stringify(managers), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch managers" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

router.get("/api/managers/:id", async (request, { params }) => {
  try {
    const manager = await getManagerCard(params.id)

    if (!manager) {
      return new Response(JSON.stringify({ error: "Manager not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify(manager), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

// Authentication route
router.post("/api/auth/login", async (request) => {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Felhasználónév és jelszó megadása kötelező" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get all managers
    const managers = await getManagerCards()

    // Find manager by name and password
    const manager = managers.find((m) => m.name.toLowerCase() === username.toLowerCase() && m.password === password)

    if (!manager) {
      return new Response(JSON.stringify({ error: "Érvénytelen felhasználónév vagy jelszó" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        manager: {
          id: manager.id,
          name: manager.name,
          role: manager.role,
          permissions: manager.permissions,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: "Bejelentkezési hiba" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

// Reward issuance route
router.post("/api/rewards/issue", async (request) => {
  try {
    const contentType = request.headers.get("content-type") || ""
    let data

    if (contentType.includes("application/json")) {
      data = await request.json()
    } else {
      const formData = await request.formData()
      data = {
        employeeId: formData.get("employeeId"),
        cardType: formData.get("cardType"),
        cardId: formData.get("cardId"),
        managerApproval: formData.get("managerApproval"),
        managerName: formData.get("managerName"),
        managerRole: formData.get("managerRole"),
      }
    }

    const { employeeId, cardType, cardId, managerApproval, managerName, managerRole } = data

    if (!employeeId || !cardType || !cardId) {
      return new Response(JSON.stringify({ error: "Minden mező kitöltése kötelező" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // For gold and platinum cards, require manager approval
    if ((cardType === "gold" || cardType === "platinum") && !managerApproval) {
      return new Response(JSON.stringify({ error: "Vezetői jóváhagyás szükséges" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const employee = await getEmployee(employeeId)
    if (!employee) {
      return new Response(JSON.stringify({ error: "Alkalmazott nem található" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if manager approval is valid for gold/platinum cards
    if ((cardType === "gold" || cardType === "platinum") && managerApproval) {
      const manager = await getManagerCard(managerApproval)
      if (!manager) {
        return new Response(JSON.stringify({ error: "Érvénytelen vezetői jóváhagyás" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    // Assign the card
    const result = await assignExistingCard(cardId, employeeId, cardType, managerApproval, managerName, managerRole)

    // Check if the card was successfully assigned
    if (!result) {
      return new Response(JSON.stringify({ error: "A kártya azonosító már használatban van vagy érvénytelen" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true, card: result }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Jutalom kiadása sikertelen",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
})

// Catch-all route for the frontend
router.all("*", async () => {
  return new Response("Not Found", { status: 404 })
})

// Main event handler for the worker
export default {
  async fetch(request, env, ctx) {
    // Store KV namespace in the request for use in the handlers
    request.env = env

    // Handle the request with the router
    return router.handle(request)
  },
}
