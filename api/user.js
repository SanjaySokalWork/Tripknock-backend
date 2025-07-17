const express = require("express");
const router = express.Router();
const User = require("../tables/user");
const user = new User();

router.post("/login", async (req, resp) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return resp.send({
            status: false,
            message: "Please check your details and try again!"
        });
    }

    try {
        const exists = await user.existByEmail(email);
        if (exists) {
            const userData = await user.findByEmail(email);
            if (userData.password !== password) {
                return resp.send({
                    status: false,
                    message: "Please check your details and try again!",
                    errorcode: "401"
                })
            } else {
                return resp.send(userData);
            }
        } else {
            return resp.send({
                status: false,
                message: "Please check your details and try again!",
                errorcode: "402"
            });
        }
    } catch (error) {
        console.log("Error in /login route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

router.post("/add", async (req, resp) => {
    let { name, email, phone, role, password } = req.body;
    password = password + "".trim();
    const { admin } = req.headers;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied! Admin authentication required." });
    if (!name || !email || !phone || !role || !password) {
        return resp.send({
            status: false,
            message: "All fields are required: name, email, phone, role, and password."
        });
    }

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            if (await user.existByEmail(email)) {
                return resp.send({
                    status: false,
                    message: `User with email "${email}" already exists!`
                })
            }
            const userData = await user.create({
                name: name,
                email: email,
                phone: phone,
                role: role,
                password: password
            });
            if (!userData) {
                return resp.send({
                    status: false,
                    message: "Failed to create user in the database!"
                });
            }
            return resp.send({ status: true, message: `User "${name}" added successfully with role "${role}"!` });
        }
        return resp.status(401).send({ status: false, message: "Access Denied! Insufficient permissions." });
    } catch (error) {
        console.log("Error in /add route:", error);
        return resp.status(500).send({ status: false, message: `Internal Server Error: ${error.message}` });
    }
});

router.get("/all", async (req, resp) => {
    const { admin } = req.headers;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            const users = await user.findAll();
            return resp.send(users);
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Get users by role
router.get("/by-role/:role", async (req, resp) => {
    const { role } = req.params;

    try {
        const users = await user.find({ role });

        // Return data in the format { label: 'Name', value: 'Email' }
        const formattedUsers = users.map(user => ({
            label: user.name,
            value: user.email
        }));

        return resp.send(formattedUsers);
    } catch (error) {
        console.log(`Error in /by-role/${role} route:`, error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

router.post("/update", async (req, resp) => {
    const { admin } = req.headers;
    if (!req.body || req.body === undefined) return resp.status(401).send({ status: false, message: "Access Denied! Request body is required." });
    let { name, phone, role, password, email } = req.body;
    password = password + "".trim();
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied! Admin authentication required." });
    if (!email) return resp.status(500).send({ status: false, message: "Email is required for user identification." });
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            if (await user.existByEmail(email)) {
                let data = {};
                const user1 = await user.findByEmail(email);
                let changedFields = [];
                
                if (user1.name !== name) {
                    data = { ...data, name: name };
                    changedFields.push('name');
                }
                if (user1.phone !== phone) {
                    data = { ...data, phone: phone };
                    changedFields.push('phone');
                }
                if (user1.role !== role) {
                    data = { ...data, role: role };
                    changedFields.push('role');
                }
                if (password !== "" && password !== user1.password) {
                    data = { ...data, password: password };
                    changedFields.push('password');
                }
                
                if (Object.keys(data).length === 0) {
                    return resp.send({ status: false, message: "No changes detected. User information is already up to date." });
                }
                
                const users = await user.update(data, { email: email });
                const changedFieldsStr = changedFields.join(', ');
                return resp.send({ status: true, message: `User "${user1.name}" updated successfully. Changed fields: ${changedFieldsStr}` });
            } else {
                return resp.status(404).send({ status: false, message: `User with email "${email}" not found.` });
            }
        }
        return resp.status(401).send({ status: false, message: "Access Denied! Insufficient permissions." });
    } catch (error) {
        console.log("Error in update route:", error);
        return resp.status(500).send({ status: false, message: `Internal Server Error: ${error.message}` });
    }
})

router.post("/verify", async (req, resp) => {
    const { admin } = req.headers;
    const { email, id } = req.body;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });
    if (!email || !id) return resp.status(500).send({ status: false, message: "Internal Server Error" });
    try {
        if (await user.existByEmail(email)) {
            const users = await user.findByEmail(email);
            if (id !== users.id) {
                return resp.status(401).send({ status: false, message: "Access Denied!" });
            } else {
                return resp.send(users);
            }
        } else {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.post("/delete", async (req, resp) => {
    const { admin } = req.headers;
    const { id } = req.body;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied! Admin authentication required." });
    if (!id) return resp.status(500).send({ status: false, message: "User ID is required for deletion." });
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            if (await user.existsById(id)) {
                const userToDelete = await user.findById(id);
                const userName = userToDelete.name;
                const users = await user.delete({ id: id });
                return resp.send({ status: true, message: `User "${userName}" has been successfully deleted.` });
            } else {
                return resp.status(404).send({ status: false, message: `User with ID "${id}" not found.` });
            }
        }
        return resp.status(401).send({ status: false, message: "Access Denied! Insufficient permissions." });
    } catch (error) {
        console.log("Error in delete route:", error);
        return resp.status(500).send({ status: false, message: `Internal Server Error: ${error.message}` });
    }
})

router.post("/profile/update", async (req, resp) => {
    const { id, name, phone } = req.body;
    if (!id || !name || !phone) return resp.status(500).send({ status: false, message: "Internal Server Error" });
    try {
        if (await user.existsById(id)) {
            await user.update({ name: name, phone: phone }, { id: id });
            return resp.send({ status: true, message: "profile updated" });
        } else {
            return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error in /profile/update route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.post("/profile/update-password", async (req, resp) => {
    const { id, oldPassword, newPassword } = req.body;
    if (!id || !oldPassword || !newPassword) return resp.status(500).send({ status: false, message: "Internal Server Error" });
    try {
        if (await user.existsById(id)) {
            const user1 = await user.findById(id);
            if (user1.password === oldPassword) {
                await user.update({ password: newPassword }, { id: id });
                return resp.send({ status: true, message: "profile updated" });
            } else {
                return resp.send({ status: false, message: "Wrong Old Password!" })
            }
        } else {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error in /profile/update route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

module.exports = router;
