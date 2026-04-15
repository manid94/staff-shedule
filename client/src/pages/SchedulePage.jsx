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

const validateTime = (time) => {
    if (!time) return true; // Allow empty
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

const formatTimeInput = (value) => {
    // Remove any non-numeric characters except colon
    let cleaned = value.replace(/[^0-9:]/g, '');
    
    // Auto-format 4-digit input (HHMM -> HH:MM)
    if (cleaned.length === 4 && !cleaned.includes(':')) {
        const hours = cleaned.slice(0, 2);
        const minutes = cleaned.slice(2, 4);
        // Only format if hours are valid (00-23)
        if (parseInt(hours) >= 0 && parseInt(hours) <= 23) {
            cleaned = `${hours}:${minutes}`;
        }
    }
    
    // Auto-add colon after 2 digits if no colon exists yet
    if (cleaned.length === 2 && !cleaned.includes(':')) {
        cleaned = cleaned + ':';
    }
    
    // Limit to 5 characters (HH:MM)
    if (cleaned.length > 5) {
        cleaned = cleaned.slice(0, 5);
    }
    
    // If we have HH:M format, don't auto-complete the minutes
    if (cleaned.length === 4 && cleaned[2] === ':') {
        // Allow partial minutes (like "09:3")
        return cleaned;
    }
    
    // If we have HH:MM format, ensure proper formatting
    if (cleaned.length === 5 && cleaned[2] === ':') {
        const [hours, minutes] = cleaned.split(':');
        const hourNum = parseInt(hours);
        const minuteNum = parseInt(minutes);
        
        if (hourNum >= 0 && hourNum <= 23 && minuteNum >= 0 && minuteNum <= 59) {
            return cleaned;
        }
    }
    
    return cleaned;
};

export default function SchedulePage() {
    const [staff, setStaff] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        fetch("http://localhost:5000/staff")
            .then((res) => res.json())
            .then(setStaff);

        // Load cached data
        const cached = localStorage.getItem("availability");
        if (cached) {
            const parsed = JSON.parse(cached);
            const staffMap = {};
            parsed.forEach(s => {
                staffMap[s.staffId] = s;
            });
            // Wait for staff to load, but for now assume it's loaded
            // In real app, might need to adjust
            setSelectedStaff(parsed.map(s => ({
                staffId: s.staffId,
                name: s.name,
                availability: s.availability.reduce((acc, av) => {
                    acc[av.day] = { fullDay: av.fullDay, slots: av.slots };
                    return acc;
                }, {})
            })));
        }
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
        setValidationErrors({});
    };

    const toggleDay = (i, day) => {
        const updated = [...selectedStaff];

        if (!updated[i].availability[day]) {
            updated[i].availability[day] = {
                fullDay: false,
                slots: [{ start: "", end: "" }]
            };
        } else {
            delete updated[i].availability[day];
        }

        setSelectedStaff(updated);
        setValidationErrors({});
    };

    const toggleFullDay = (i, day) => {
        const updated = [...selectedStaff];
        const dayData = updated[i].availability[day];

        dayData.fullDay = !dayData.fullDay;

        if (dayData.fullDay) {
            dayData.slots = [];
        } else if (!dayData.slots || dayData.slots.length === 0) {
            dayData.slots = [{ start: "", end: "" }];
        }

        setSelectedStaff(updated);
        setValidationErrors({});
    };

    const updateSlot = (i, day, j, field, value) => {
        const updated = [...selectedStaff];
        updated[i].availability[day].slots[j][field] = value;
        setSelectedStaff(updated);
        setValidationErrors({});
    };

    const validateAvailability = () => {
        const errors = {};

        selectedStaff.forEach((staffRow) => {
            Object.entries(staffRow.availability).forEach(([day, dayData]) => {
                const key = `${staffRow.staffId}-${day}`;

                if (!dayData.fullDay) {
                    const slot = dayData.slots?.[0];

                    if (!slot || !slot.start || !slot.end) {
                        errors[key] = "Please enter start and end time or select Full Day.";
                    } else if (slot.start >= slot.end) {
                        errors[key] = "End time must be later than start time.";
                    }
                }
            });
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const generateJSON = () => {
        if (!validateAvailability()) {
            alert("Please fix availability errors before saving.");
            return;
        }

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

    const clearAvailability = () => {
        localStorage.removeItem("availability");
        setSelectedStaff([]);
        alert("Availability cleared.");
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

            <Box sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 900, tableLayout: "fixed" }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 120 }}>Staff</TableCell>
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
                                    <TableCell
                                        key={day}
                                        sx={{
                                            maxWidth: 260,
                                            minWidth: 200,
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                            verticalAlign: "top"
                                        }}
                                    >
                                        <Checkbox
                                            checked={!!dayData}
                                            onChange={() => toggleDay(i, day)}
                                        />

                                        {dayData && (
                                            <Box sx={{ mt: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={dayData.fullDay}
                                                        onChange={() => toggleFullDay(i, day)}
                                                    />
                                                    <span>Full Day</span>
                                                </Box>

                                                {!dayData.fullDay && (
                                                    <Box
                                                        sx={{
                                                            maxHeight: 180,
                                                            overflowY: "auto",
                                                            scrollBehavior: "smooth",
                                                            transition: "max-height 0.25s ease",
                                                            pr: 1,
                                                            mt: 1
                                                        }}
                                                    >
                                                        {dayData.slots.slice(0, 1).map((slot, j) => (
                                                            <Box
                                                                key={j}
                                                                sx={{
                                                                    display: "flex",
                                                                    gap: 1,
                                                                    flexWrap: "wrap",
                                                                    alignItems: "center",
                                                                    mb: 1,
                                                                    transition: "all 0.2s ease",
                                                                    padding: "2%",
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                <TextField
                                                                    type="text"
                                                                    size="small"
                                                                    label="Start (HH:MM)"
                                                                    value={slot.start}
                                                                    placeholder="09:00"
                                                                    InputLabelProps={{ shrink: true }}
                                                                    sx={{ width: 130, minWidth: 130 }}
                                                                    error={!validateTime(slot.start)}
                                                                    helperText={!validateTime(slot.start) ? "Invalid time format" : ""}
                                                                    onChange={(e) =>
                                                                        updateSlot(
                                                                            i,
                                                                            day,
                                                                            j,
                                                                            "start",
                                                                            formatTimeInput(e.target.value)
                                                                        )
                                                                    }
                                                                />
                                                                <TextField
                                                                    type="text"
                                                                    size="small"
                                                                    label="End (HH:MM)"
                                                                    value={slot.end}
                                                                    placeholder="17:00"
                                                                    InputLabelProps={{ shrink: true }}
                                                                    sx={{ width: 130, minWidth: 130 }}
                                                                    error={!validateTime(slot.end)}
                                                                    helperText={!validateTime(slot.end) ? "Invalid time format" : ""}
                                                                    onChange={(e) =>
                                                                        updateSlot(
                                                                            i,
                                                                            day,
                                                                            j,
                                                                            "end",
                                                                            formatTimeInput(e.target.value)
                                                                        )
                                                                    }
                                                                />
                                                            </Box>
                                                        ))}
                                                        {validationErrors[`${s.staffId}-${day}`] && (
                                                            <Box sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}>
                                                                {validationErrors[`${s.staffId}-${day}`]}
                                                            </Box>
                                                        )}
                                                    </Box>
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
            </Box>

            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button variant="contained" onClick={generateJSON}>
                    Save Availability
                </Button>
                <Button variant="outlined" color="error" onClick={clearAvailability}>
                    Clear Data
                </Button>
            </Box>
        </Paper>
    );
}