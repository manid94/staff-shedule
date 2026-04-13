import React, { useEffect, useState } from "react";
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

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("availability") || "[]");
        setAvailability(data);
    }, []);

    // 🔥 TIME OVERLAP CHECK
    const isOverlap = (s1, e1, s2, e2) => {
        if (!s1 || !e1 || !s2 || !e2) return false;
        return !(e1 <= s2 || e2 <= s1);
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

        // ✅ Validate ONLY when full data present
        if (
            newRow.staffId &&
            newRow.start &&
            newRow.end &&
            isStaffBusy(newRow.staffId, day, newRow.start, newRow.end, store)
        ) {
            alert("Staff already assigned in overlapping time!");
            return;
        }

        updated[index] = newRow;

        setAllocations((prev) => ({
            ...prev,
            [store]: {
                ...prev[store],
                [day]: updated
            }
        }));
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

        STORES.forEach((store) => {
            const row = { Store: store };

            DAYS.forEach((day) => {
                const cellData = allocations[store]?.[day] || [];

                const value = cellData
                    .map((r) => {
                        const staff = availability.find(
                            (s) => s.staffId === r.staffId
                        );

                        return staff
                            ? `${staff.name} (${r.start || ""}-${r.end || ""})`
                            : "";
                    })
                    .join(", ");

                row[day] = value;
            });

            rows.push(row);
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, "Allotment");
        XLSX.writeFile(wb, "Allotment.xlsx");
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
                                    {(allocations[store]?.[day] || []).map((row, i) => (
                                        <Box key={i} sx={{ mb: 1 }}>
                                            <Autocomplete
                                                options={availability}
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
                                                value={row.start || ""}
                                                onChange={(e) =>
                                                    updateRow(store, day, i, "start", e.target.value)
                                                }
                                                sx={{ mt: 1 }}
                                            />

                                            <TextField
                                                type="time"
                                                size="small"
                                                value={row.end || ""}
                                                onChange={(e) =>
                                                    updateRow(store, day, i, "end", e.target.value)
                                                }
                                                sx={{ mt: 1 }}
                                            />

                                            <Button
                                                color="error"
                                                onClick={() => removeRow(store, day, i)}
                                            >
                                                ❌
                                            </Button>
                                        </Box>
                                    ))}

                                    <Button size="small" onClick={() => addRow(store, day)}>
                                        + Add
                                    </Button>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Button variant="contained" sx={{ mt: 2 }} onClick={exportToExcel}>
                Export Excel
            </Button>
        </Paper>
    );
}