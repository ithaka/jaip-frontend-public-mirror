export enum DenialReasons {
  Sex = 'Sexually explicit',
  Instruction = 'Instructive for explosives, weapons, or escapes',
  Violence = 'Inflammatory or inciting violence, uprisings, or riots',
  Order = 'Detrimental to the good order of the facility or rehabilitation',
  Incomplete = 'Missing required information',
  Other = 'Other',
}

export enum DenialCommentErrors {
  Required = 'Please provide details for denial.',
  TooShort = 'Please provide additional information.',
  TooLong = 'Comments must be less than 3000 characters.',
}
