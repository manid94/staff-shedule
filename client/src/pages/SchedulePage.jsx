import React, { useEffect, useState } from "react";
import {
    Autocomplete,
    TextField,
    Button,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Checkbox,
    Box
} from "@mui/material";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchedulePage() {
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/staff")
            .then((res) => res.json())
            .then(setStaff);
    }, []);

    const addStaff = (value) => {
        if (!value) return;

        if (selectedStaff.find((s) => s.staffId === value.id)) return;

        setSelectedStaff([
            ...selectedStaff,
            {
                staffId: value.id,
                name: value.name,
                availability: {}
            }
        ]);
    };

    const toggleDay = (i, day) => {
        const updated = [...selectedStaff];

        if (!updated[i].availability[day]) {
            updated[i].availability[day] = {
                fullDay: true,
                slots: []
            };
        } else {
            delete updated[i].availability[day];
        }

        setSelectedStaff(updated);
    };

    const toggleFullDay = (i, day) => {
        const updated = [...selectedStaff];
        const dayData = updated[i].availability[day];

        dayData.fullDay = !dayData.fullDay;

        if (dayData.fullDay) {
            dayData.slots = [];
        }

        setSelectedStaff(updated);
    };

    const addSlot = (i, day) => {
        const updated = [...selectedStaff];

        updated[i].availability[day].slots.push({
            start: "",
            end: ""
        });

        updated[i].availability[day].fullDay = false;

        setSelectedStaff(updated);
    };

    const updateSlot = (i, day, j, field, value) => {
        const updated = [...selectedStaff];
        updated[i].availability[day].slots[j][field] = value;
        setSelectedStaff(updated);
    };

    const generateJSON = () => {
        const output = selectedStaff.map((s) => ({
            staffId: s.staffId,
            name: s.name,
            availability: Object.entries(s.availability).map(
                ([day, value]) => ({
                    day,
                    fullDay: value.fullDay,
                    slots: value.slots
                })
            )
        }));

        localStorage.setItem("availability", JSON.stringify(output));
        alert("Saved!");
    };

    return (
        <Paper sx={{ p: 2 }}>
            <h2>Weekly Availability (Grid)</h2>

            <Autocomplete
                options={staff}
                getOptionLabel={(o) => o.name}
                onChange={(e, v) => addStaff(v)}
                renderInput={(params) => (
                    <TextField {...params} label="Add Staff" />
                )}
                sx={{ mb: 2 }}
            />

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Staff</TableCell>
                        {DAYS.map((d) => (
                            <TableCell key={d}>{d}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {selectedStaff.map((s, i) => (
                        <TableRow key={s.staffId}>
                            <TableCell>{s.name}</TableCell>

                            {DAYS.map((day) => {
                                const dayData = s.availability[day];

                                return (
                                    <TableCell key={day}>
                                        <Checkbox
                                            checked={!!dayData}
                                            onChange={() => toggleDay(i, day)}
                                        />

                                        {dayData && (
                                            <Box>
                                                <Button
                                                    size="small"
                                                    onClick={() => toggleFullDay(i, day)}
                                                >
                                                    {dayData.fullDay ? "Full" : "Slots"}
                                                </Button>

                                                {!dayData.fullDay &&
                                                    dayData.slots.map((slot, j) => (
                                                        <Box key={j} sx={{ display: "flex", gap: 1 }}>
                                                            <TextField
                                                                type="time"
                                                                size="small"
                                                                value={slot.start}
                                                                onChange={(e) =>
                                                                    updateSlot(
                                                                        i,
                                                                        day,
                                                                        j,
                                                                        "start",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <TextField
                                                                type="time"
                                                                size="small"
                                                                value={slot.end}
                                                                onChange={(e) =>
                                                                    updateSlot(
                                                                        i,
                                                                        day,
                                                                        j,
                                                                        "end",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </Box>
                                                    ))}

                                                {!dayData.fullDay && (
                                                    <Button
                                                        size="small"
                                                        onClick={() => addSlot(i, day)}
                                                    >
                                                        + Slot
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Button variant="contained" onClick={generateJSON} sx={{ mt: 2 }}>
                Save Availability
            </Button>
        </Paper>
    );
}