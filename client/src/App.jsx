import React, { useState } from "react";
import { Container, Button, Box } from "@mui/material";
import StaffPage from "./pages/StaffPage";
import SchedulePage from "./pages/SchedulePage";

export default function App() {
  const [page, setPage] = useState("staff");

  return (
    <Container>
      <Box sx={{ display: "flex", gap: 2, my: 2 }}>
        <Button onClick={() => setPage("staff")} variant="contained">
          Staff
        </Button>
        <Button onClick={() => setPage("schedule")} variant="contained">
          Schedule
        </Button>
      </Box>

      {page === "staff" ? <StaffPage /> : <SchedulePage />}
    </Container>
  );
}