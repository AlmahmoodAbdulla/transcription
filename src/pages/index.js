import useSWR, { mutate as globalMutate } from 'swr';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField, Container, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';

const fetcher = url => axios.get(url).then(res => res.data);

const StatsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(3, 0),
  backgroundColor: theme.palette.background.paper, // or a light gradient
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  justifyContent: 'center',
}));

const StyledAudioContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  margin: theme.spacing(2, 0),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
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
  console.log("Stat data: ", statData)
  useEffect(() => {
    if (data && data.transcription) {
      setValue('transcription', data.transcription);
    }
  }, [data, setValue]);

  const onSubmit = async (formData) => {
    await axios.post('/api/audio', { id: data.id, transcription: formData.transcription });
    mutate(nextData, false);
    mutateStat();
    fetchNextAudio();
    reset({ transcription: '' });
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
    <Container maxWidth="sm" sx={{ pt: 3, pb: 3 }}>
      <Typography variant="h6" gutterBottom align="center">
        Audio id: {data?.id}
      </Typography>
      <Typography variant="h6" gutterBottom align="center">
        {data?.file_name}
      </Typography>
      <StyledAudioContainer>
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          fullWidth
          label="Transcription"
          {...register('transcription')}
          multiline
          rows={2}
          variant="outlined"
          margin="normal"
          inputProps={{ style: { direction: 'rtl', backgroundColor: 'white' } }}
        />
        <Box textAlign="center" marginTop={2}>
          <Button fullWidth type="submit" variant="contained" color="primary" size="large">
            Save and Next
          </Button>
        </Box>
        <Box textAlign="center" marginTop={2}>
          <Button fullWidth onClick={skipAudio} variant="contained" color="secondary" size="large">
            Skip
          </Button>
          <Box textAlign="center" marginTop={2}>
            <Button fullWidth onClick={openDialog} variant="contained" color="error" size="large">
              Delete
            </Button>
          </Box>
        </Box>
      </form>
      <StatsPaper elevation={3}>
        <Typography variant="h6" gutterBottom component="div">
          Total Transcribed Today: <strong>{statData?.stat_data.todays_transcriptions}</strong>
        </Typography>
        <Typography variant="h6" gutterBottom component="div">
          Total Transcribed: <strong>{statData?.stat_data.total_transcribed}</strong>
        </Typography>
        <Typography variant="h6" gutterBottom component="div">
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
    </Container >
  );
}
