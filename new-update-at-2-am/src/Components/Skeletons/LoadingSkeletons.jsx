import React from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton, Grid, Card, CardContent } from '@mui/material';

export const TableSkeleton = ({ rowsNum = 5, columnsNum = 6 }) => (
  <Box sx={{ width: '100%' }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {[...Array(columnsNum)].map((_, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(rowsNum)].map((_, index) => (
              <TableRow key={index}>
                {[...Array(columnsNum)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  </Box>
);

export const CardSkeleton = ({ height = 200 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="rectangular" height={height} />
      <Box sx={{ pt: 2 }}>
        <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="60%" />
      </Box>
    </CardContent>
  </Card>
);

export const GridCardsSkeleton = ({ count = 4, xs = 12, sm = 6, md = 3 }) => (
  <Grid container spacing={2}>
    {[...Array(count)].map((_, index) => (
      <Grid item xs={xs} sm={sm} md={md} key={index}>
        <CardSkeleton />
      </Grid>
    ))}
  </Grid>
);

export const AnalyticsSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={300} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={300} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={300} />
        </Paper>
      </Grid>
    </Grid>
  </Box>
); 