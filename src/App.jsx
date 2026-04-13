import React, { useState } from "react";
import { Container, Button, Box } from "@mui/material";
import StaffPage from "./pages/StaffPage";
import SchedulePage from "./pages/SchedulePage";

export default function App() {
  const [page, setPage] = useState("staff");

  return (
    <Container>
      <Box sx={{ display: "flex", gap: 2, my: 2 }}>
        <Button variant="contained" onClick={() => setPage("staff")}>
          Staff Management
        </Button>
        <Button variant="contained" onClick={() => setPage("schedule")}>
          Schedule
        </Button>
      </Box>

      {page === "staff" ? <StaffPage /> : <SchedulePage />}
    </Container>
  );
}