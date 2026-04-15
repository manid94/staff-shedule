import React, { useEffect, useState, useRef } from "react";
import {
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Autocomplete,
    TextField,
    Button,
    Box
} from "@mui/material";
import * as XLSX from "xlsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STORES = [
    "Norton Fisheries",
    "Durham Lane",
    "MR Chippy",
    "Jolly Fryer"
];

export default function AllotmentPage() {
    const [availability, setAvailability] = useState([]);
    const [allocations, setAllocations] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const debounceTimers = useRef({});

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("availability") || "[]");
        setAvailability(data);

        const savedAllocations = JSON.parse(sessionStorage.getItem("allocations") || "{}");
        setAllocations(savedAllocations);
    }, []);

    useEffect(() => {
        sessionStorage.setItem("allocations", JSON.stringify(allocations));
    }, [allocations]);

    useEffect(() => {
        return () => {
            // Cleanup debounce timers on unmount
            Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    // 🔥 TIME OVERLAP CHECK
    const isOverlap = (s1, e1, s2, e2) => {
        if (!s1 || !e1 || !s2 || !e2) return false;
        return !(e1 <= s2 || e2 <= s1);
    };

    // 🔥 CHECK IF TIME IS WITHIN STAFF AVAILABILITY
    const isTimeAvailable = (staffId, day, start, end) => {
        if (!staffId || !start || !end) return true; // allow if incomplete

        const staffAvail = availability.find(s => s.staffId === staffId);
        if (!staffAvail) return false;

        const dayAvail = staffAvail.availability.find(a => a.day === day);
        if (!dayAvail) return false;

        if (dayAvail.fullDay) return true;

        // check if start-end is within any slot
        for (const slot of dayAvail.slots) {
            if (slot.start <= start && slot.end >= end) {
                return true;
            }
        }

        return false;
    };

    // 🔥 CHECK STAFF BUSY IN OTHER STORES
    const isStaffBusy = (staffId, day, start, end, currentStore) => {
        if (!staffId || !start || !end) return false;

        for (const store of STORES) {
            const rows = allocations[store]?.[day] || [];

            for (const r of rows) {
                if (!r.staffId || !r.start || !r.end) continue;

                // skip same store same row
                if (store === currentStore) continue;

                if (r.staffId === staffId) {
                    if (isOverlap(start, end, r.start, r.end)) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    const toMinutes = (time) => {
        if (!time) return null;
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const fromMinutes = (minutes) => {
        const hrs = String(Math.floor(minutes / 60)).padStart(2, "0");
        const mins = String(minutes % 60).padStart(2, "0");
        return `${hrs}:${mins}`;
    };

    const getDayAvailability = (staffId, day) => {
        const staffAvail = availability.find((s) => s.staffId === staffId);
        if (!staffAvail) return null;
        return staffAvail.availability.find((a) => a.day === day) || null;
    };

    const normalizeAvailability = (dayAvail) => {
        if (!dayAvail) return [];
        if (dayAvail.fullDay) {
            return [{ start: "00:00", end: "23:59" }];
        }
        return dayAvail.slots.filter((slot) => slot.start && slot.end);
    };

    const subtractAssigned = (availableSlots, assignedSlots) => {
        const filled = assignedSlots
            .map((slot) => ({ start: toMinutes(slot.start), end: toMinutes(slot.end) }))
            .filter((slot) => slot.start != null && slot.end != null)
            .sort((a, b) => a.start - b.start);

        const remaining = [];

        for (const avail of availableSlots) {
            let current = toMinutes(avail.start);
            const end = toMinutes(avail.end);

            for (const assigned of filled) {
                if (assigned.end <= current || assigned.start >= end) continue;

                if (assigned.start > current) {
                    remaining.push({ start: current, end: Math.min(assigned.start, end) });
                }

                current = Math.max(current, assigned.end);
                if (current >= end) break;
            }

            if (current < end) {
                remaining.push({ start: current, end });
            }
        }

        return remaining;
    };

    const getAssignedSlots = (staffId, day, exclude = {}) => {
        const slots = [];

        for (const store of STORES) {
            const rows = allocations[store]?.[day] || [];
            rows.forEach((row, index) => {
                if (!row.staffId || row.staffId !== staffId) return;
                if (exclude.store === store && exclude.day === day && exclude.index === index) return;
                if (row.start && row.end) {
                    slots.push({ start: row.start, end: row.end });
                }
            });
        }

        return slots;
    };

    const getRemainingAvailability = (staffId, day, exclude = {}) => {
        const dayAvail = getDayAvailability(staffId, day);
        const availableSlots = normalizeAvailability(dayAvail);
        if (!availableSlots.length) return [];

        const assignedSlots = getAssignedSlots(staffId, day, exclude);
        return subtractAssigned(availableSlots, assignedSlots);
    };

    const isStaffFullyAllocated = (staffId, day, exclude = {}) => {
        const remaining = getRemainingAvailability(staffId, day, exclude);
        return remaining.length === 0;
    };

    const getStaffOptions = (day, currentStaffId) =>
        availability.filter((staff) =>
            staff.staffId === currentStaffId || !isStaffFullyAllocated(staff.staffId, day)
        );

    const getSlotForRow = (staffId, day, start) => {
        const dayAvail = getDayAvailability(staffId, day);
        const slots = normalizeAvailability(dayAvail);

        if (!start) {
            return slots.length ? slots[0] : null;
        }

        const value = toMinutes(start);
        return slots.find((slot) => toMinutes(slot.start) <= value && toMinutes(slot.end) >= value) || slots[0] || null;
    };

    const getValidationError = (staffId, day, start, end, store) => {
        if (!isTimeAvailable(staffId, day, start, end)) {
            return "Time not available for this staff member";
        }
        if (isStaffBusy(staffId, day, start, end, store)) {
            return "Staff overlaps with assignment at another store";
        }
        return null;
    };

    // ➕ Add row
    const addRow = (store, day) => {

        setAllocations((prev) => ({
            ...prev,
            [store]: {
                ...prev[store],
                [day]: [...(prev[store]?.[day] || []), {}]
            }
        }));
    };

    // 🔄 Update row (FINAL LOGIC)
    const updateRow = (store, day, index, field, value) => {
        const updated = [...(allocations[store]?.[day] || [])];

        const newRow = {
            ...updated[index],
            [field]: value
        };

        const errorKey = `${store}-${day}-${index}`;

        updated[index] = newRow;

        setAllocations((prev) => ({
            ...prev,
            [store]: {
                ...prev[store],
                [day]: updated
            }
        }));

        // Debounced validation
        if (debounceTimers.current[errorKey]) {
            clearTimeout(debounceTimers.current[errorKey]);
        }

        debounceTimers.current[errorKey] = setTimeout(() => {
            // ✅ Validate ONLY when full data present
            if (newRow.staffId && newRow.start && newRow.end) {
                const error = getValidationError(newRow.staffId, day, newRow.start, newRow.end, store);
                
                if (error) {
                    setValidationErrors((prev) => ({
                        ...prev,
                        [errorKey]: error
                    }));
                } else {
                    // Clear error if validation passes
                    setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[errorKey];
                        return newErrors;
                    });
                }
            }

            delete debounceTimers.current[errorKey];
        }, 400); // 400ms debounce delay
    };

    // ❌ Remove row
    const removeRow = (store, day, index) => {
        const updated = [...(allocations[store]?.[day] || [])];
        updated.splice(index, 1);

        setAllocations((prev) => ({
            ...prev,
            [store]: {
                ...prev[store],
                [day]: updated
            }
        }));
    };

    // 📊 EXPORT TO EXCEL
    const exportToExcel = () => {
        const rows = [];
        const staffHoursByStore = {}; // { staffId: { storeName: hours, ... }, ... }

        STORES.forEach((store) => {
            const row = { Store: store };
            let totalMinutes = 0;

            DAYS.forEach((day) => {
                const cellData = allocations[store]?.[day] || [];

                const value = cellData
                    .map((r) => {
                        const staff = availability.find(
                            (s) => s.staffId === r.staffId
                        );

                        // Calculate minutes for this allocation
                        if (r.start && r.end) {
                            const startMin = toMinutes(r.start);
                            const endMin = toMinutes(r.end);
                            if (startMin != null && endMin != null) {
                                const duration = endMin - startMin;
                                totalMinutes += duration;

                                // Track staff hours per store
                                if (!staffHoursByStore[r.staffId]) {
                                    staffHoursByStore[r.staffId] = { name: staff?.name || "Unknown" };
                                }
                                if (!staffHoursByStore[r.staffId][store]) {
                                    staffHoursByStore[r.staffId][store] = 0;
                                }
                                staffHoursByStore[r.staffId][store] += duration / 60; // Convert to hours
                            }
                        }

                        return staff
                            ? `${staff.name} (${r.start || ""}-${r.end || ""})`
                            : "";
                    })
                    .join(", ");

                row[day] = value;
            });

            // Convert minutes to hours with decimal
            const totalHours = (totalMinutes / 60).toFixed(2);
            row["Total Hours"] = totalHours;

            rows.push(row);
        });

        // Create staff summary sheet
        const staffRows = [];
        Object.entries(staffHoursByStore).forEach(([staffId, storeHours]) => {
            const staffRow = { "Staff Name": storeHours.name };
            let totalStaffHours = 0;

            STORES.forEach((store) => {
                const hours = storeHours[store] || 0;
                staffRow[store] = hours.toFixed(2);
                totalStaffHours += hours;
            });

            staffRow["Total Combined Hours"] = totalStaffHours.toFixed(2);
            staffRows.push(staffRow);
        });

        // Create workbook with two sheets
        const wb = XLSX.utils.book_new();

        // Sheet 1: Store allocation
        const ws1 = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws1, "Store Allocation");

        // Sheet 2: Staff summary
        const ws2 = XLSX.utils.json_to_sheet(staffRows);
        XLSX.utils.book_append_sheet(wb, ws2, "Staff Summary");

        XLSX.writeFile(wb, "Allotment.xlsx");
    };

    const validateAllAllocations = () => {
        let hasErrors = false;
        const newErrors = {};

        STORES.forEach((store) => {
            DAYS.forEach((day) => {
                const rows = allocations[store]?.[day] || [];
                rows.forEach((row, index) => {
                    if (row.staffId && row.start && row.end) {
                        const error = getValidationError(row.staffId, day, row.start, row.end, store);
                        if (error) {
                            newErrors[`${store}-${day}-${index}`] = error;
                            hasErrors = true;
                        }
                    }
                });
            });
        });

        setValidationErrors(newErrors);

        if (hasErrors) {
            alert("Validation failed. Check highlighted fields for errors.");
        } else {
            alert("All allocations are valid!");
        }
    };

    const clearAllocations = () => {
        if (window.confirm("Are you sure you want to clear all allocations?")) {
            setAllocations({});
            sessionStorage.removeItem("allocations");
            setValidationErrors({});
            alert("Allocations cleared.");
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <h2>Allotment Grid</h2>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Store</TableCell>
                        {DAYS.map((d) => (
                            <TableCell key={d}>{d}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {STORES.map((store) => (
                        <TableRow key={store}>
                            <TableCell>{store}</TableCell>

                            {DAYS.map((day) => (
                                <TableCell key={day}>
                                    {(allocations[store]?.[day] || []).map((row, i) => {
                                        const staffOptions = getStaffOptions(day, row.staffId);
                                        const selectedDayAvail = getDayAvailability(row.staffId, day);
                                        const currentSlot = getSlotForRow(row.staffId, day, row.start);
                                        const startMin = currentSlot ? currentSlot.start : selectedDayAvail && selectedDayAvail.fullDay ? "00:00" : selectedDayAvail?.slots?.[0]?.start;
                                        const startMax = currentSlot ? currentSlot.end : selectedDayAvail?.slots?.[selectedDayAvail.slots.length - 1]?.end;
                                        const endMin = row.start || currentSlot?.start || "00:00";
                                        const endMax = currentSlot ? currentSlot.end : selectedDayAvail && selectedDayAvail.fullDay ? "23:59" : selectedDayAvail?.slots?.[selectedDayAvail.slots.length - 1]?.end;
                                        const errorKey = `${store}-${day}-${i}`;
                                        const hasError = validationErrors[errorKey];

                                        return (
                                            <Box key={i} sx={{ mb: 1 }}>
                                                <Autocomplete
                                                    options={staffOptions}
                                                    getOptionLabel={(o) => o.name}
                                                    value={
                                                        availability.find(
                                                            (s) => s.staffId === row.staffId
                                                        ) || null
                                                    }
                                                    onChange={(e, v) =>
                                                        updateRow(store, day, i, "staffId", v?.staffId)
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Staff" size="small" />
                                                    )}
                                                />

                                                <TextField
                                                    type="time"
                                                    size="small"
                                                    label="Start"
                                                    value={row.start || ""}
                                                    inputProps={{ min: startMin, max: startMax }}
                                                    onChange={(e) =>
                                                        updateRow(store, day, i, "start", e.target.value)
                                                    }
                                                    sx={{ mt: 1 }}
                                                    error={!!hasError}
                                                />

                                                <TextField
                                                    type="time"
                                                    size="small"
                                                    label="End"
                                                    value={row.end || ""}
                                                    inputProps={{ min: endMin, max: endMax }}
                                                    onChange={(e) =>
                                                        updateRow(store, day, i, "end", e.target.value)
                                                    }
                                                    sx={{ mt: 1 }}
                                                    error={!!hasError}
                                                />

                                                {hasError && (
                                                    <Box sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}>
                                                        {hasError}
                                                    </Box>
                                                )}

                                                <Button
                                                    color="error"
                                                    onClick={() => removeRow(store, day, i)}
                                                >
                                                    ❌
                                                </Button>
                                            </Box>
                                        );
                                    })}

                                    <Button size="small" onClick={() => addRow(store, day)}>
                                        + Add
                                    </Button>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button variant="contained" onClick={exportToExcel}>
                    Export Excel
                </Button>
                <Button variant="outlined" color="warning" onClick={validateAllAllocations}>
                    Validate
                </Button>
                <Button variant="outlined" color="error" onClick={clearAllocations}>
                    Clear Data
                </Button>
            </Box>
        </Paper>
    );
}