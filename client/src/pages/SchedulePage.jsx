import React, { useEffect, useState } from "react";
import {
    Autocomplete,
    TextField,
    Table,
    TableRow,
    TableCell,
    TableHead,
    TableBody,
    Button,
    Paper
} from "@mui/material";
import dayjs from "dayjs";

export default function SchedulePage() {
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState([]);
    const [dates, setDates] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/staff")
            .then((res) => res.json())
            .then(setStaff);

        generateDates(7);
    }, []);

    const generateDates = (days) => {
        const arr = [];
        for (let i = 0; i < days; i++) {
            arr.push(dayjs().add(i, "day").format("YYYY-MM-DD"));
        }
        setDates(arr);
    };

    const addStaff = (value) => {
        if (!value) return;
        if (selectedStaff.find((s) => s.id === value.id)) return;

        setSelectedStaff([...selectedStaff, { ...value, availability: {} }]);
    };

    const removeStaff = (id) => {
        setSelectedStaff(selectedStaff.filter((s) => s.id !== id));
    };

    const toggle = (id, date) => {
        setSelectedStaff((prev) =>
            prev.map((s) =>
                s.id === id
                    ? {
                        ...s,
                        availability: {
                            ...s.availability,
                            [date]: !s.availability[date]
                        }
                    }
                    : s
            )
        );
    };

    const generateJSON = () => {
        const output = selectedStaff.map((s) => ({
            staffId: s.id,
            name: s.name,
            availability: dates.map((d) => ({
                date: d,
                available: !!s.availability[d]
            }))
        }));

        alert(JSON.stringify(output, null, 2));
    };

    return (
        <Paper sx={{ p: 2 }}>
            <h2>Schedule</h2>

            <Autocomplete
                options={staff}
                getOptionLabel={(o) => o.name}
                onChange={(e, v) => addStaff(v)}
                renderInput={(params) => <TextField {...params} label="Add Staff" />}
            />

            <Button onClick={() => generateDates(7)}>7 Days</Button>
            <Button onClick={() => generateDates(10)}>10 Days</Button>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Staff</TableCell>
                        {dates.map((d) => (
                            <TableCell key={d}>{d}</TableCell>
                        ))}
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {selectedStaff.map((s) => (
                        <TableRow key={s.id}>
                            <TableCell>{s.name}</TableCell>

                            {dates.map((d) => (
                                <TableCell key={d} onClick={() => toggle(s.id, d)}>
                                    {s.availability[d] ? "✅" : "❌"}
                                </TableCell>
                            ))}

                            <TableCell>
                                <Button color="error" onClick={() => removeStaff(s.id)}>
                                    Remove
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Button variant="contained" onClick={generateJSON} sx={{ mt: 2 }}>
                Generate JSON
            </Button>
        </Paper>
    );
}