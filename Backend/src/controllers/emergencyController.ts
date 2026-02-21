res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
}
