import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper
} from "@mui/material";
import initialData from "../data/staff.json";

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState({
        name: "",
        mobileNo: "",
        emailId: "",
        otherDetails: ""
    });

    useEffect(() => {
        const stored = localStorage.getItem("staff");
        setStaff(stored ? JSON.parse(stored) : initialData);
    }, []);

    const save = (data) => {
        setStaff(data);
        localStorage.setItem("staff", JSON.stringify(data));
    };

    const addStaff = () => {
        if (!form.name || !form.mobileNo) return;

        const newStaff = {
            id: Date.now().toString(),
            ...form
        };

        save([...staff, newStaff]);
        setForm({ name: "", mobileNo: "", emailId: "", otherDetails: "" });
    };

    const deleteStaff = (id) => {
        save(staff.filter((s) => s.id !== id));
    };

    return (
        <Paper sx={{ p: 2 }}>
            <h2>Staff Management</h2>

            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Mobile" value={form.mobileNo} onChange={(e) => setForm({ ...form, mobileNo: e.target.value })} />
            <TextField label="Email" value={form.emailId} onChange={(e) => setForm({ ...form, emailId: e.target.value })} />
            <TextField label="Other" value={form.otherDetails} onChange={(e) => setForm({ ...form, otherDetails: e.target.value })} />

            <Button onClick={addStaff} variant="contained" sx={{ m: 1 }}>
                Add
            </Button>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {staff.map((s) => (
                        <TableRow key={s.id}>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.mobileNo}</TableCell>
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