import React, { useEffect, useState } from "react";
import axios from "axios";
import { Event, Info, Update } from "@mui/icons-material";
import {
  Snackbar,
  Stack,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const AnnouncementToast = ({ event }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/common/announcements/event/${event}`
        );
        const announcements = response.data;

        // Get shown announcements from localStorage
        const shownAnnouncements =
          JSON.parse(localStorage.getItem("shownAnnouncements")) || {};
        const currentDate = new Date().toISOString();

        // Filter announcements that haven't been shown in the last 24 hours
        const newAnnouncements = announcements.filter((announcement) => {
          const lastShown = shownAnnouncements[announcement._id];
          if (!lastShown) return true;
          const timeDiff = new Date(currentDate) - new Date(lastShown);
          return timeDiff > 24 * 60 * 60 * 1000; // 24 hours
        });

        setAnnouncements(newAnnouncements);
        if (newAnnouncements.length > 0) {
          setCurrentAnnouncement(newAnnouncements[0]);
          setOpen(true);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchAnnouncements();
  }, [event]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);

    // Mark the current announcement as shown
    const shownAnnouncements =
      JSON.parse(localStorage.getItem("shownAnnouncements")) || {};
    if (currentAnnouncement) {
      shownAnnouncements[currentAnnouncement._id] = new Date().toISOString();
      localStorage.setItem("shownAnnouncements", JSON.stringify(shownAnnouncements));
    }

    // Show next announcement if available
    const nextAnnouncement = announcements[1];
    if (nextAnnouncement) {
      setAnnouncements((prev) => prev.slice(1));
      setCurrentAnnouncement(nextAnnouncement);
      setOpen(true);
    }
  };

  // Brighter icon colors for better visibility
  const getCategoryStyles = (category) => {
    switch (category) {
      case "Event":
        return { color: "#FF4081", icon: <Event fontSize="small" /> }; // Bright pink
      case "Update":
        return { color: "#4CAF50", icon: <Update fontSize="small" /> }; // Bright green
      default:
        return { color: "#2196F3", icon: <Info fontSize="small" /> }; // Bright blue
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{
        top: "15px",
        width: "95%",
        maxWidth: "500px",
        "& .MuiSnackbarContent-root": {
          background: "transparent",
          boxShadow: "none",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
          borderRadius: 3,
          boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
          p: 2.5,
          animation: "fadeInSlide 0.4s ease-out",
          overflow: "hidden",
        }}
      >
        {/* Close Button */}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#777",
            transition: "0.2s",
            "&:hover": { color: "#333" },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* List of Announcements */}
        <List sx={{ p: 0 }}>
          {announcements.map((announcement, index) => {
            const { color, icon } = getCategoryStyles(announcement.category);
            return (
              <ListItem
                key={index}
                sx={{
                  borderBottom: index !== announcements.length - 1 ? "1px solid #e0e0e0" : "none",
                  py: 1.5,
                  transition: "0.3s ease",
                  "&:hover": { backgroundColor: "#f9f9f9" },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: color, color: "#fff" }}>{icon}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="h6" fontWeight="bold" sx={{ color: "#222" }}>
                      {announcement.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: "#555" }}>
                      {announcement.content}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Snackbar>
  );
};

export default AnnouncementToast;
