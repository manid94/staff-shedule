import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Box
} from "@mui/material";

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState({
        name: "",
        mobileNo: "",
        emailId: "",
        otherDetails: ""
    });

    const loadStaff = async () => {
        const res = await fetch("http://localhost:5000/staff");
        const data = await res.json();
        setStaff(data);
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const addStaff = async () => {
        const res = await fetch("http://localhost:5000/staff", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(form)
        });

        const newStaff = await res.json();
        setStaff([...staff, newStaff]);

        setForm({ name: "", mobileNo: "", emailId: "", otherDetails: "", other: "" });
    };

    const deleteStaff = async (id) => {
        await fetch(`http://localhost:5000/staff/${id}`, {
            method: "DELETE"
        });

        setStaff(staff.filter((s) => s.id !== id));
    };

    return (
        <Paper sx={{ p: 2 }}>
            <h2>Staff Management</h2>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <TextField label="Mobile" value={form.mobileNo} onChange={(e) => setForm({ ...form, mobileNo: e.target.value })} />
                    <TextField label="Email" value={form.emailId} onChange={(e) => setForm({ ...form, emailId: e.target.value })} />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField 
                        label="Other Details" 
                        value={form.otherDetails} 
                        onChange={(e) => setForm({ ...form, otherDetails: e.target.value })} 
                        fullWidth 
                    />
                    <Button onClick={addStaff} variant="contained">
                        Add
                    </Button>
                </Box>
            </Box>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Other Details</TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {staff.map((s) => (
                        <TableRow key={s.id}>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.mobileNo}</TableCell>
                            <TableCell>{s.emailId}</TableCell>
                            <TableCell>{s.otherDetails}</TableCell>
                            <TableCell>
                                <Button color="error" onClick={() => deleteStaff(s.id)}>
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
}