import React, { useState } from "react";
import { Container, Button, Box } from "@mui/material";
import StaffPage from "./pages/StaffPage";
import SchedulePage from "./pages/SchedulePage";
import AllotmentPage from "./pages/AllotmentPage";

export default function App() {
  const [page, setPage] = useState("staff");

  return (
    <Container>
      <Box sx={{ display: "flex", gap: 2, my: 2 }}>
        <Button onClick={() => setPage("staff")} variant="contained">
          Staff
        </Button>
        <Button onClick={() => setPage("schedule")} variant="contained">
          Availability
        </Button>
        <Button onClick={() => setPage("allotment")} variant="contained">
          Allotment
        </Button>
      </Box>

      {page === "staff" && <StaffPage />}
      {page === "schedule" && <SchedulePage />}
      {page === "allotment" && <AllotmentPage />}
    </Container>
  );
}