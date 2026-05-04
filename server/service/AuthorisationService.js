export class AuthorisationService {
    password

    constructor(password) {
        this.password = password
    }

    static create() {
        const password = Deno.env.get("ADMIN_PASSWORD") ?? "admin"
        return new AuthorisationService(password)
    }

    checkAdmin(req) {
        const auth = req.headers.get("Authorization")
        if (auth?.startsWith("Basic ")) {
            const [, password] = atob(auth.slice(6)).split(":")
            if (password === this.password) return null
        }
        return new Response("Unauthorized", {
            status: 401,
            headers: { "WWW-Authenticate": 'Basic realm="Admin Portal"' },
        })
    }
}
