import useSWR, { mutate as globalMutate } from 'swr';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, Container, Box, Typography, Paper, CircularProgress, Backdrop } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';

const fetcher = url => axios.get(url).then(res => res.data);

const StatsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  justifyContent: 'center',
  flexGrow: 1,
  fontFamily: '"Courier New", monospace'
}));

const StyledAudioContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  margin: theme.spacing(1, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  flexGrow: 1, // Added this line
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5),
    margin: theme.spacing(1, 0),
  }
}));

export default function Home() {
  const [nextData, setNextData] = useState(null); // State to hold the prefetched data
  const { data, mutate, error } = useSWR('/api/audio', fetcher, {
    revalidateOnFocus: false, onSuccess: (data) => {
      // Pre-fetch the next audio immediately after loading the current one
      fetchNextAudio();
    }
  });

  const fetchNextAudio = async () => {
    const nextAudioData = await fetcher('/api/audio');
    setNextData(nextAudioData);
  };
  const { data: statData, mutate: mutateStat, error: statError } = useSWR('/api/stats', fetcher);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [audioKey, setAudioKey] = useState(0);  // Used to force re-render the audio component on error
  const [open, setOpen] = useState(false);  // Dialog open state
  const [loading, setLoading] = useState(false);
  console.log("Stat data: ", statData)
  useEffect(() => {
    if (data && data.transcription) {
      setValue('transcription', data.transcription);
    }
  }, [data, setValue]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await axios.post('/api/audio', { id: data.id, transcription: formData.transcription });
      mutate(nextData, false);
      mutateStat();

    } finally {
      setLoading(false);
      reset({ transcription: '' });
      fetchNextAudio();
    }
  };

  const reloadAudio = () => {
    setAudioKey(prevKey => prevKey + 1);  // Increment key to force re-render of audio component
  };

  const skipAudio = () => {
    mutate(nextData, false);
    mutateStat();
    fetchNextAudio();
  };

  const deleteAudio = () => {
    axios.post('/api/deleteAudio', { id: data.id });
    mutate(nextData, false);
    mutateStat();
    fetchNextAudio();
    setOpen(false);
  }

  const openDialog = () => {
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
  };

  if (error) return <Typography variant="h6" color="error">Failed to load: {error}</Typography>;
  if (!data) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress color="primary" />
    </Box>
  );

  return (
    <Container maxWidth="sm" sx={{ pt: 3, pb: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '95vh' }}>
      <Typography variant="h6" gutterBottom align="center" sx={{ fontFamily: '"Courier New", monospace' }}>
        {data?.file_name}
      </Typography>
      <StyledAudioContainer sx={{ flexGrow: 0 }}>
        <audio
          controls
          autoPlay
          loop
          src={data.file}
          style={{ width: '100%' }}
          key={audioKey}  // Use key to force re-render on error
          onError={reloadAudio}  // Handle audio load error
        />
      </StyledAudioContainer>
      <form onSubmit={handleSubmit(onSubmit)} sx={{ flexGrow: 1 }}>
        <TextField
          fullWidth
          label="Transcription"
          {...register('transcription')}
          multiline
          rows={4}
          variant="outlined"
          margin="normal"
          inputProps={{ style: { direction: 'rtl', backgroundColor: 'white', fontSize: '20px', fontFamily: 'Noto Sans Arabic, sans-serif' } }}
        />
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button onClick={openDialog} variant="contained" color="error" size="large" sx={{ flex: 1, mr: 1 }}>
            Delete
          </Button>
          <Button onClick={skipAudio} variant="contained" color="secondary" size="large" sx={{ flex: 1, mr: 1 }}>
            Skip
          </Button>
          <Button type="submit" variant="contained" color="primary" size="large" sx={{ flex: 1, mr: 1 }}>
            Save
          </Button>
        </Box>
      </form>
      {loading && (
        <Backdrop open={true} style={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      <StatsPaper elevation={3} sx={{ flexGrow: 0 }}>
        <Typography variant="h6" gutterBottom component="div" sx={{ fontFamily: '"Courier New", monospace' }}>
          Total Transcribed Today: <strong>{statData?.stat_data.todays_transcriptions}</strong>
        </Typography>
        <Typography variant="h6" gutterBottom component="div" sx={{ fontFamily: '"Courier New", monospace' }}>
          Total Transcribed: <strong>{statData?.stat_data.total_transcribed}</strong>
        </Typography>
        <Typography variant="h6" gutterBottom component="div" sx={{ fontFamily: '"Courier New", monospace' }}>
          Remaining Transcriptions: <strong>{statData?.stat_data.remaining_transcriptions}</strong>
        </Typography>
      </StatsPaper>
      <Dialog
        open={open}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this audio file? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={deleteAudio} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
